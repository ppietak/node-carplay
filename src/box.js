const stream = require('stream')

const protocol = require('./protocol')
const usb = require('./usb')

const HEADER_SIZE = 16;
const HEARTBEAT_INTERVAL_MS = 2000;

// const bus = new events.EventEmitter()
const videoStream = new stream.PassThrough()
const audioStream = new stream.PassThrough()

let heartbeatInterval

let currentBuffer = Buffer.from('', 'binary')
let currentType
let remainingDataLength

const onStarted = async () => {
	await new Promise(res => setTimeout(res, 1000))

	heartbeatInterval = setInterval(onHeartbeat, HEARTBEAT_INTERVAL_MS)

	for (const packet of protocol.startupInfo) {
		await send(packet)
	}
}

const onStopped = () => {
	clearInterval(heartbeatInterval)
	heartbeatInterval = undefined
}

const onData = (data) => {
	if (data.length <= remainingDataLength && currentType === protocol.type.VIDEO) {
		onVideo(data)
		remainingDataLength -= data.length

		if (remainingDataLength === 0) {
			currentBuffer = Buffer.from('', 'binary')
			currentType = undefined
		}
	} else if (data.length <= remainingDataLength && currentType === protocol.type.AUDIO) {
		onAudio(data)
		remainingDataLength -= data.length

		if (remainingDataLength === 0) {
			currentBuffer = Buffer.from('', 'binary')
			currentType = undefined
		}
	} else if (data.length <= remainingDataLength && currentType) {
		currentBuffer = Buffer.concat([currentBuffer, data])
		remainingDataLength -= data.length

		if (remainingDataLength === 0) {
			onCommand(currentType, currentBuffer)

			currentBuffer = Buffer.from('', 'binary')
			currentType = undefined
		}
	} else if (data.length === HEADER_SIZE) {
		const [magicNumber, dataLength, type, typeCheck] = protocol.unpack('<LLLL', data.slice(0, HEADER_SIZE))

		if (!protocol.verifyType(type, typeCheck)) {
			console.error('BAD TYPE', type, data.length, data);
			return;
		}

		if (!protocol.verifyMagicNumber(magicNumber)) {
			console.error('BAD MAGIC NUMBER');
			return;
		}

		remainingDataLength = dataLength
		currentType = type;
	} else {
		console.log('?', data.byteLength)
		currentType = undefined
	}
}

const onVideo = (data) => {
	// process.stdout.write('V')

	const NALUnitOffset = data.indexOf(new Uint8Array([0x00, 0x00, 0x00, 0x01]));
	const videoData = NALUnitOffset === 20 ? data.slice(20) : data
	videoStream.write(videoData)
}

const onAudio = (data) => {
	// process.stdout.write('A')
	audioStream.write(data)
}

const onCommand = (type, payload) => {
	// process.stdout.write('C')

	switch (type) {
		case protocol.type.SETUP: {
			console.log('> SETUP', protocol.unpack('<LLLLLLL', payload))
			break;
		}

		case protocol.type.CARPLAY:
			console.log('> CARPLAY', protocol.unpack('<L', payload))
			break;

		case protocol.type.CONNECTION:
			console.log('> CONNECTED', protocol.unpack('<L', payload))
			break;

		case protocol.type.PHASE:
			console.log('> PHASE', protocol.unpack('<L', payload))
			break;

		case protocol.type.DISCONNECTED:
			console.log('> DISCONNECTED', protocol.unpack('<L', payload))
			break;

		case protocol.type.DEVICE_NAME:
			console.log('> DEVICE NAME', payload.toString())
			break;

		case protocol.type.DEVICE_SSID:
			console.log('> DEVICE SSID', payload.toString())
			break;

		case protocol.type.KNOWN_DEVICES:
			console.log('> KNOWN DEVICES (BLUETOOTH)\n', payload.toString().trim().split('\n').filter(l => l.trim().length).reduce((acc, v) => ({ ...acc, [v.substring(0, 17)]: v.substring(17) }), {}))
			break;

		case protocol.type.SOFTWARE_VERSION:
			console.log('> SOFTWARE VERSION', payload.toString())
			break;

		// case protocol.type.AUDIO:
		// const [width, height, flags, x1, x2] = struct.unpack('LLLLL', data.slice(0, 20))
		// console.log('> AUDIO')
		/*

		amount = len(data) - 12
		(self.decodeType, self.volume, self.audioType) = struct.unpack("<LfL", data[:12])
		if amount == 1:
			self.command = _setenum(self.Command, data[12])
		elif amount == 4:
			self.volumeDuration = struct.unpack("<L", data[12:])
		else:
			# data is uncompressed, of the format specified in self.decodeType (ints appear to be signed)
		self.data = data[12:]

		 */
		// break;

		default:
			console.log('-', type, payload.toString())
	}
}

const onHeartbeat = async () => {
	await send(protocol.buildHeartbeatPacket())
}

const send = async (packet) => {
	if (packet.byteLength > HEADER_SIZE) {
		await usb.transfer(packet.slice(0, HEADER_SIZE))
		await usb.transfer(packet.slice(HEADER_SIZE))
	} else {
		await usb.transfer(packet)
	}
}

module.exports = {
	start: () => {
		const usbBus = usb.start()

		usbBus.on('started', onStarted)
		usbBus.on('stopped', onStopped)
		usbBus.on('data', onData)
	},
	sendTouchUp: async (x, y) => {
		await send(protocol.buildTouchPacket(protocol.touch.UP, x, y))
	},
	sendTouchMove: async (x, y) => {
		await send(protocol.buildTouchPacket(protocol.touch.MOVE, x, y))
	},
	sendTouchDown: async (x, y) => {
		await send(protocol.buildTouchPacket(protocol.touch.DOWN, x, y))
	},
	sendButton: async (code) => {
		await send(protocol.buildButtonPacket(code))
	},
	getVideoStream: () => videoStream,
	getAudioStream: () => audioStream,
}
