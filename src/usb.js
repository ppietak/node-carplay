const usb = require('usb')
const events = require('events')

const logger = require('./logger')

const DEVICE_ID = 5408;
const CONNECTION_TIMEOUT = 5000;

const bus = new events.EventEmitter();

let connecting = false
let iface
let writeEndpoint
let readEndpoint

const findReadEndpoint = deviceInterface => {
	const end = deviceInterface && deviceInterface.endpoints.find(e => e.direction === 'in')
	if (!end) {
		throw new Error('Box read endpoint not found')
	}
	return end
}

const findWriteEndpoint = deviceInterface => {
	const end = deviceInterface && deviceInterface.endpoints.find(e => e.direction === 'out')
	if (!end) {
		throw new Error('Box write endpoint not found')
	}
	return end
}

const clean = () => {
	iface && iface.release(true, () => {})
	iface = undefined
	writeEndpoint = undefined
	readEndpoint = undefined
}

const onAttach = (device) => {
	if (!connecting && device.deviceDescriptor.idProduct === DEVICE_ID) {
		logger.info('Box attached')
		connect(device)
	}
}

const onDetach = (device) => {
	if (device.deviceDescriptor.idProduct === DEVICE_ID) {
		logger.info('Box detached')

		bus.emit('stopped')
		clean()
	}
}

const onConnected = async (deviceInterface) => {
	logger.info('Box connected')
	connecting = false

	iface = deviceInterface
	readEndpoint = findReadEndpoint(iface);
	writeEndpoint = findWriteEndpoint(iface);

	readEndpoint.once('error', onError)
	readEndpoint.on('error', () => {})

	bus.emit('started')
}

const onError = (error) => {
	logger.error(error)
	connecting = false

	bus.emit('stopped')
	clean()
}

const connect = (device) => {
	logger.info('Connecting box...')
	connecting = true

	setTimeout(() => {
		if (connecting) onError('Could not connect')
	}, CONNECTION_TIMEOUT)

	try {
		device = device || usb.getDeviceList().find(dev => dev.deviceDescriptor.idProduct === DEVICE_ID)

		if (!device) {
			throw new Error('No device to connect')
		}

		if (device.deviceDescriptor.idProduct !== DEVICE_ID) {
			throw new Error('Bad device')
		}

		device.open();

		const deviceInterface = device.interface(0);
		deviceInterface.claim();

		iface = deviceInterface
		readEndpoint = findReadEndpoint(iface);
		writeEndpoint = findWriteEndpoint(iface);

		readEndpoint.clearHalt(() => {
			writeEndpoint.clearHalt(() => {
				onConnected(deviceInterface)
			})
		});
	} catch (e) {
		onError(e)
	}
}

const read = (size) => {
	if (!size) {
		return null
	}

	try {
		return new Promise((res, rej) => {
			if (!readEndpoint) {
				rej('No device to read from')
			} else {
				readEndpoint.transfer(size, (err, data) => {
					if (err) console.error(err)
					if (err) rej(err)
					res(data)
				})
			}
		}).catch(err => {
			onError('Read error: ', err)
		})
	} catch (e) {
		onError('Read error: ', e)
	}
}

const write = (message) => {
	try {
		return new Promise((res, rej) => {
			if (!writeEndpoint) {
				rej('No device to write to')
			} else {
				writeEndpoint.transfer(message, (err) => {
					if (err) logger.error(err)
					if (err) rej(err)
					res()
				})
			}
		}).catch(err => {
			onError('Write error: ', err)
		})
	} catch (e) {
		onError('Write error: ', e)
	}
}

module.exports = {
	start: () => {
		connect()
		usb.on('attach', onAttach)
		usb.on('detach', onDetach)

		return bus
	},
	read,
	write,
}
