const protocol = require('./protocol');
const struct = require('python-struct');
const usb = require('usb');
const events = require('events')
const stream = require('stream')

const DEVICE_ID = 5408;
const HEADER_SIZE = 16;

const videoStream = new stream.PassThrough()
const bus = new events.EventEmitter();

let endpointInput = null
let endpointOutput = null
let connected = false

const connect = (device) => {
	device = device || usb.getDeviceList().find(dev => dev.deviceDescriptor.idProduct === DEVICE_ID)

	if (!device) return;
	if (device.deviceDescriptor.idProduct !== DEVICE_ID) return;

	device.open();

	const deviceInterface = device.interface(0);
	deviceInterface.claim();

	endpointInput = deviceInterface.endpoints.find(e => e.direction === 'in');
	endpointOutput = deviceInterface.endpoints.find(e => e.direction === 'out');

	endpointInput.clearHalt(() => endpointOutput.clearHalt(() => bus.emit('connected')));
	endpointOutput.timeout = 0;
}

const send = async (message) => {
	await endpointOutput.transfer(message.slice(0, HEADER_SIZE));
	await endpointOutput.transfer(message.slice(HEADER_SIZE));
}

const sendAll = async (messages) => {
	for (const message of messages) {
		await send(message)
	}
}

const receive = (format, data) => {
	return struct.unpack('<' + format, data)
}

const onAttach = (device) => {
	console.log('attached')
	connect(device)
}

const onDetach = (device) => {
	console.log('detached')
	connected = false
}

const onConnected = async () => {
	console.log('connected')
	connected = true

	let buffer = Buffer.from('', 'binary')
	let expectedDataLength
	let currentType

	endpointInput.on('data', (data) => {
		// console.log('DATA', data)

		if (data.length === HEADER_SIZE) {
			const [magicNumber, dataLength, type, typeCheck] = struct.unpack('<LLLL', data.slice(0, HEADER_SIZE))

			if (!protocol.verifyType(type, typeCheck)) {
				console.error('BAD TYPE');
				return;
			}

			if (!protocol.verifyMagicNumber(magicNumber)) {
				console.error('BAD MAGIC NUMBER');
				return;
			}

			expectedDataLength = dataLength
			currentType = type;

		} else if (data.length <= expectedDataLength && currentType) {
			buffer = Buffer.concat([buffer, data])
			expectedDataLength -= data.length

			if (expectedDataLength === 0) {
				bus.emit('message', {type: currentType, data: buffer})

				buffer = Buffer.from('', 'binary')
				currentType = undefined
			}
		} else {
			console.log('?', buffer.byteLength)
			currentType = undefined
		}
	})

	endpointInput.on('error', data => console.log('ERROR', data))
	endpointInput.on('end', data => console.log('END', data))
	endpointInput.startPoll()

	await sendAll(protocol.startupInfo)

	setInterval(() => bus.emit('heartbeat'), 1000)
}

const onHeartbeat = async () => {
	if (connected) {
		// console.log('heartbeat')
		const message = protocol.makeHeartbeat()
		await send(message)
	}
}

const onMessage = async ({type, data}) => {
	switch (type) {
		case protocol.type.SETUP: {
			const [width, height, fps, format, packetMax, deviceVersion, phoneWorkMode] = receive('LLLLLLL', data);
			console.log('> SETUP', width, height, fps, format, packetMax, deviceVersion, phoneWorkMode)

			await sendAll(protocol.afterSetupInfo)

			break;
		}

		case protocol.type.VIDEO:
			const [width, height, flags, x1, x2] = receive('LLLLL', data.slice(0, 20))
			// console.log('> VIDEO', {width, height, flags, x1, x2})
			console.log('> VIDEO', data.length)

			const videoData = data.slice(20)
			videoStream.write(videoData)

			break;

		case protocol.type.CARPLAY:
			const data1 = receive('L', data);
			console.log('> CARPLAY', data1)
			break;

		case protocol.type.CONNECTION:
			console.log('> PLUGGED', data.toString())
			break;

		case protocol.type.STREAMING:
			console.log('> SOMETHING')
			break;

		case protocol.type.DEVICE_NAME:
			console.log('> DEVICE NAME', data.toString())
			break;

		case protocol.type.DEVICE_SSID:
			console.log('> DEVICE SSID', data.toString())
			break;

		case protocol.type.KNOWN_DEVICES:
			console.log('> KNOWN DEVICES (BLUETOOTH)\n', data.toString().trim().split('\n').filter(l => l.trim().length).reduce((acc, v) => ({ ...acc, [v.substring(0, 17)]: v.substring(17) }), {}))
			break;

		case protocol.type.SOFTWARE_VERSION:
			console.log('> SOFTWARE VERSION', data.toString())
			break;

		case protocol.type.AUDIO:
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
			break;

		default:
			console.log('-', type, data.toString())
	}
}

usb.on('attach', onAttach)
usb.on('detach', onDetach)

module.exports = {
	start: () => {
		usb.setDebugLevel(3);
		usb.on('attach', onAttach)
		usb.on('detach', onDetach)

		bus.on('connected', onConnected)
		bus.on('heartbeat', onHeartbeat)
		bus.on('message', onMessage)

		connect()

		return {videoStream}
	},

	send,

	sendAll,

	receive,
}
