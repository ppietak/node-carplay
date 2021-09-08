const stream = require('stream')
const events = require('events')

const logger = require('./logger')
const protocol = require('./protocol')
const usb = require('./usb')

const HEADER_SIZE = 16;
const HEARTBEAT_INTERVAL_MS = 2000;

const bus = new events.EventEmitter()
const videoOutputStream = new stream.PassThrough()
const audioStereoStream = new stream.PassThrough()
const audioMonoStream = new stream.PassThrough()
const microphoneInput = new stream.PassThrough()
let messageQueue = []
let heartbeatQueue = []

let boxWidth, boxHeight, boxFps
let heartbeatInterval

let microphoneIsOn = false

const readLoop = async () => {
	while (true) {
		const header = await usb.read(HEADER_SIZE);
		const [type, length] = protocol.unpackHeader(header)
		const payload = await usb.read(length)

		handlePacket(type, payload)
	}
}

const writeLoop = async () => {
	heartbeatInterval = setInterval(onHeartbeat, HEARTBEAT_INTERVAL_MS)
	heartbeatQueue = []
	messageQueue = []

	while (true) {
		try {
			const message = heartbeatQueue.shift() || messageQueue.shift();
			if (message) {
				if (message.byteLength > HEADER_SIZE) {
					await usb.write(message.slice(0, HEADER_SIZE))
					await usb.write(message.slice(HEADER_SIZE))
				} else {
					await usb.write(message)
				}
				// console.log(messageQueue.length)
			}
		} catch (e) {
			console.error(e)
		}

		await new Promise(res => setTimeout(res, 10))
	}
}

const handlePacket = (type, payload) => {
	if (!payload) {
		return
	}

	switch (type) {
		case protocol.type.VIDEO:
			videoOutputStream.write(payload)
			break

		case protocol.type.AUDIO:
			// console.log(payload.length, payload)

			const [audioType, volume, decodeType] = protocol.unpack('<LfL', payload);
			const data = payload.slice(12);

			if (payload.length === 13) {
				const [command] = protocol.unpack('<B', data)
				logger.debug('> AUDIO', [decodeType, volume, audioType, command])

				switch (command) {
					case protocol.audioCommand.SIRI_START:
						microphoneIsOn = true
						bus.emit('audio_siri_start')
						// setTimeout(() => { microphoneIsOn = false }, 30000)
						break

					case protocol.audioCommand.SIRI_STOP:
						microphoneIsOn = false
						bus.emit('audio_siri_stop')
						break
				}
			} else {
				if (audioType === protocol.audioType.MONO) {
					audioMonoStream.write(data)
				} else if (audioType === protocol.audioType.STEREO) {
					audioStereoStream.write(data)
				}
			}
			break

		case protocol.type.SETUP: {
			logger.debug('> SETUP', protocol.unpack('<LLLLLLL', payload))
			break;
		}

		case protocol.type.CARPLAY:
			logger.debug('> CARPLAY', protocol.unpack('<L', payload))
			break;

		case protocol.type.CONNECTION:
			logger.debug('> CONNECTED', protocol.unpack('<L', payload))
			break;

		case protocol.type.PHASE:
			logger.debug('> PHASE', protocol.unpack('<L', payload))
			break;

		case protocol.type.DISCONNECTED:
			logger.debug('> DISCONNECTED', protocol.unpack('<L', payload))
			break;

		case protocol.type.DEVICE_NAME:
			logger.debug('> DEVICE NAME', payload.toString())
			break;

		case protocol.type.DEVICE_SSID:
			logger.debug('> DEVICE SSID', payload.toString())
			break;

		case protocol.type.KNOWN_DEVICES:
			logger.debug('> KNOWN DEVICES (BLUETOOTH)\n', payload.toString().trim().split('\n').filter(l => l.trim().length).reduce((acc, v) => ({ ...acc, [v.substring(0, 17)]: v.substring(17) }), {}))
			break;

		case protocol.type.SOFTWARE_VERSION:
			logger.debug('> SOFTWARE VERSION', payload.toString())
			break;

		default:
			logger.debug('-', type, payload.toString())
	}
}

const onStarted = async () => {
	writeLoop()

	await new Promise(res => setTimeout(res, 500))
	await send(protocol.buildSetupPacket(boxWidth, boxHeight, boxFps, 5))

	readLoop()

	await new Promise(res => setTimeout(res, 500))
	await send(protocol.buildCarplayPacket(protocol.carplay.AUTO_CONNECT))
}

const onStopped = () => {
	clearInterval(heartbeatInterval)
	heartbeatInterval = undefined
	microphoneIsOn = false
}

const onMicrophoneData = async (data) => {
	if (!microphoneIsOn) {
		return
	}

	// console.log(data.byteLength)
	await send(protocol.buildAudioPacket(data))
}

const onHeartbeat = async () => {
	heartbeatQueue.push(protocol.buildHeartbeatPacket())
}

const send = async (packet) => {
	messageQueue.push(packet)
}

module.exports = {
	start: (width, height, fps) => {
		boxWidth = width
		boxHeight = height
		boxFps = fps

		const usbBus = usb.start()

		usbBus.on('started', onStarted)
		usbBus.on('stopped', onStopped)

		microphoneInput.on('data', onMicrophoneData)
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
		await send(protocol.buildCarplayPacket(code))
	},
	videoOutputStream,
	audioStereoStream,
	audioMonoStream,
	microphoneInput,
	bus,
	button: protocol.carplay,
}
