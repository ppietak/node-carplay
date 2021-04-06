const usb = require('usb')
const events = require('events')

const DEVICE_ID = 5408;

const bus = new events.EventEmitter();

let connecting = false
let iface

const findReadEndpoint = deviceInterface => {
	const end = deviceInterface && deviceInterface.endpoints.find(e => e.direction === 'in')
	if (!end) {
		throw new Error('Device read endpoint not found')
	}
	return end
}
const findWriteEndpoint = deviceInterface => {
	const end = deviceInterface && deviceInterface.endpoints.find(e => e.direction === 'out')
	if (!end) {
		throw new Error('Device write endpoint not found')
	}
	return end
}
const clean = () => {
	iface && iface.release(true, () => {})
	iface = undefined
}

const onAttach = (device) => {
	if (!connecting && device.deviceDescriptor.idProduct === DEVICE_ID) {
		console.log('USB attached')
		connect(device)
	}
}

const onDetach = (device) => {
	if (device.deviceDescriptor.idProduct === DEVICE_ID) {
		console.log('USB detached')

		bus.emit('stopped')
		clean()
	}
}

const onConnected = (deviceInterface) => {
	console.log('Device connected')
	connecting = false

	iface = deviceInterface

	findReadEndpoint(iface).on('data', onData)
	findReadEndpoint(iface).once('error', onError)
	findReadEndpoint(iface).on('error', () => {})
	findReadEndpoint(iface).startPoll()

	bus.emit('started')
}

const onDisconnected = () => {
	console.log('Device disconnected')

	bus.emit('stopped')
	clean()
}

const onError = (error) => {
	console.log('Error', error)
	connecting = false

	bus.emit('stopped')
	clean()
}

const onData = (data) => {
	bus.emit('data', data)
}

const connect = (device) => {
	console.log('Connecting...')
	connecting = true

	try {
		device = device || usb.getDeviceList().find(dev => dev.deviceDescriptor.idProduct === DEVICE_ID)

		if (!device) {
			throw new Error('No device')
		}

		if (device.deviceDescriptor.idProduct !== DEVICE_ID) {
			throw new Error('Bad device')
		}

		device.open();

		const deviceInterface = device.interface(0);
		deviceInterface.claim();

		iface = deviceInterface

		findReadEndpoint(iface).clearHalt(() => {
			findWriteEndpoint(iface).timeout = 0;
			findWriteEndpoint(iface).clearHalt(() => {
				onConnected(deviceInterface)
			})
		});
	} catch (e) {
		onError(e)
	}
}

const transfer = (message) => {
	try {
		// console.log('Transferring', message)
		return findWriteEndpoint(iface).transfer(message);
	} catch (e) {
		onError(e)
	}
}

usb.on('attach', onAttach)
usb.on('detach', onDetach)

module.exports = {
	start: () => {
		connect()
		return bus
	},
	transfer,
}