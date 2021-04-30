const stream = require('stream')
const events = require('events')

const protocol = require('./protocol')
const usb = require('./usb')

const HEADER_SIZE = 16;
const HEARTBEAT_INTERVAL_MS = 2000;

const audioStereoHeader = new Uint8Array([0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00])
const audioMonoHeader = new Uint8Array([0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00])

const bus = new events.EventEmitter()
const videoOutputStream = new stream.PassThrough()
const audioStereoStream = new stream.PassThrough()
const audioMonoStream = new stream.PassThrough()
const audioInputStream = new stream.PassThrough()

let boxWidth, boxHeight, boxFps
let heartbeatInterval

let streamingAudioInput = false

const run = async () => {
	while (true) {
		const header = await usb.read(16);
		const [type, length] = protocol.unpackHeader(header)
		const payload = await usb.read(length)
		handlePacket(type, payload)
	}
}

const handlePacket = (type, payload) => {
	switch (type) {
		case protocol.type.VIDEO:
			videoOutputStream.write(payload)
			break

		case protocol.type.AUDIO:
			break

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

		default:
			console.log('-', type, payload.toString())
	}
}

const onStarted = async () => {
	await new Promise(res => setTimeout(res, 500))

	heartbeatInterval = setInterval(onHeartbeat, HEARTBEAT_INTERVAL_MS)

	await send(protocol.buildSetupPacket(boxWidth, boxHeight, boxFps, 5))
	await run()
}

const onStopped = () => {
	clearInterval(heartbeatInterval)
	heartbeatInterval = undefined
	streamingAudioInput = false
}

// let lastAudioHeader
//
// const onAudio = (data) => {
// 	// console.log(data.length, data)
// 	const headerSize = 12;
// 	const amount = data.length - headerSize
//
// 	if (amount === 1) {
// 		const [decodeType, volume, audioType, command] = protocol.unpack('<LfLB', data);
// 		console.log('> AUDIO', decodeType, volume, audioType, command)
//
// 		switch (command) {
// 			case protocol.audioCommand.OUTPUT_START:
// 				if (decodeType === protocol.audioType.STEREO) {
// 					bus.emit('audio_stereo_start')
// 				} else {
// 					bus.emit('audio_mono_start')
// 				}
// 				break
//
// 			case protocol.audioCommand.OUTPUT_STOP:
// 				if (decodeType === protocol.audioType.STEREO) {
// 					bus.emit('audio_stereo_stop')
// 				} else {
// 					bus.emit('audio_mono_stop')
// 				}
// 				break
//
// 			case protocol.audioCommand.SIRI_START:
// 				streamingAudioInput = true
// 				bus.emit('audio_siri_start')
// 				break
//
// 			case protocol.audioCommand.SIRI_STOP:
// 				streamingAudioInput = false
// 				bus.emit('audio_siri_stop')
// 				break
// 		}
// 	} else if (amount === 4) {
// 		console.log('> AUDIO VOL DUR', protocol.unpack("<L", data.slice(headerSize)))
// 	} else {
// 		if (data.indexOf(audioMonoHeader) === 0) {
// 			lastAudioHeader = audioMonoHeader
// 			audioMonoStream.write(data.slice(headerSize))
// 		} else if (data.indexOf(audioStereoHeader) === 0) {
// 			lastAudioHeader = audioStereoHeader
// 			audioStereoStream.write(data.slice(headerSize))
// 		} else {
// 			if (lastAudioHeader === audioMonoHeader) {
// 				audioMonoStream.write(data)
// 			} else if (lastAudioHeader === audioStereoHeader) {
// 				audioStereoStream.write(data)
// 			} else {
// 			}
// 		}
// 	}
// }
//
// const onAudioInput = async (data) => {
// 	if (streamingAudioInput) {
// 		// console.log(data.byteLength)
// 		// await send(protocol.buildAudioPacket(data))
// 		// await new Promise(res => setTimeout(res, 20))
// 		// console.log(data.byteLength, data)
// 	}
// }

const onHeartbeat = async () => {
	await send(protocol.buildHeartbeatPacket())
}

const send = async (packet) => {
	if (packet.byteLength > HEADER_SIZE) {
		await usb.write(packet.slice(0, HEADER_SIZE))
		await usb.write(packet.slice(HEADER_SIZE))
	} else {
		await usb.write(packet)
	}
}

module.exports = {
	start: (width, height, fps) => {
		boxWidth = width
		boxHeight = height
		boxFps = fps

		const usbBus = usb.start()

		usbBus.on('started', onStarted)
		usbBus.on('stopped', onStopped)
		// audioInputStream.on('data', onAudioInput)
	},
	sendTouchUp: async (x, y) => {
		await send(protocol.buildTouchPacket(protocol.touch.UP, x/boxWidth*10000, y/boxHeight*10000))
	},
	sendTouchMove: async (x, y) => {
		await send(protocol.buildTouchPacket(protocol.touch.MOVE, x/boxWidth*10000, y/boxHeight*10000))
	},
	sendTouchDown: async (x, y) => {
		await send(protocol.buildTouchPacket(protocol.touch.DOWN, x/boxWidth*10000, y/boxHeight*10000))
	},
	sendButton: async (code) => {
		await send(protocol.buildButtonPacket(code))
	},
	videoOutputStream,
	audioStereoStream,
	audioMonoStream,
	audioInputStream,
	bus,
	button: protocol.button,
}
