const usb = require('usb');
const protocol = require('./protocol');
const struct = require('python-struct');
const bignum = require('bignum');

const {EventEmitter} = require('events')
const bus = new EventEmitter();

usb.setDebugLevel(3);

let endIn = null
let endOut = null
let connected = false

let tmpNextLength
let tmpNextType

const attemptConnection = (device) => {
	if (typeof device === 'undefined') return;
	if (device.deviceDescriptor.idProduct !== 5408) return;

	device.open();

	const iface = device.interface(0);
	iface.claim();

	// await new Promise(res => setTimeout(res, 1500));

	endIn = iface.endpoints.find(e => e.direction === 'in');
	endOut = iface.endpoints.find(e => e.direction === 'out');

	endIn.clearHalt(() => { endOut.clearHalt(() => { bus.emit('connected'); }); });

	endOut.timeout = 0;
	// endOut.transferType = usb.LIBUSB_TRANSFER_TYPE_CONTROL

	// bus.emit('connected');
}

usb.on('attach', async(device) => {
	console.log('attached')

	attemptConnection(device)
});

usb.on('detach', device => {
	console.log('detached')

	connected = false
});

bus.on('connected', async() => {
	console.log('connected')

	connected = true

	endIn.on('data', (data) => {
		if (data.length === 16) {
			const [magicNumber, dataLength, type, typeCheck] = struct.unpack('<LLLL', data.slice(0, 16))

			if (!protocol.verifyType(type, typeCheck)) {
				console.error('BAD TYPE');
				return;
			}

			if (!protocol.verifyMagicNumber(magicNumber)) {
				console.error('BAD MAGIC NUMBER');
				return;
			}

			tmpNextLength = dataLength;
			tmpNextType = type;
		} else if (tmpNextType && tmpNextLength) {
			if (data.length === Number.parseInt(tmpNextLength)) {
				bus.emit('message', {type: tmpNextType, data})
			} else {
				// console.error('BAD LENGTH')
				console.error('BAD LENGTH', data.length, data.toString().substring(0, 64))
			}

			tmpNextLength = null;
			tmpNextType = null;
		}
	})
	endIn.on('error', data => {
		console.log('ERROR', data);
	})
	endIn.on('end', data => {
		console.log('END', data);
	})

	endIn.startPoll()
	// await new Promise(res => setTimeout(res, 1000));

	for (const msg of protocol.startupInfo) {
		await endOut.transfer(msg.slice(0, 16))
		await endOut.transfer(msg.slice(16))
		// await new Promise(res => setTimeout(res, 50));
	}
})

bus.on('message', async({type, data}) => {
	console.log('-', type, data.toString())

	switch (type) {
		case 1:
			console.log('> SETUP')

			for (const msg of protocol.afterSetupInfo) {
				await endOut.transfer(msg.slice(0, 16));
				await endOut.transfer(msg.slice(16));
			}

			break;

		case 2:
			console.log('> PLUGGED')
			break;

		case 8:

			break;
	}
})

const device = usb.getDeviceList().find(dev => dev.deviceDescriptor.idProduct === 5408);
attemptConnection(device)
