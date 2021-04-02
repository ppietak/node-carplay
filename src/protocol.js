const struct = require('python-struct');
const bignum = require('bignum');
const long = require('long');
const fs = require('fs');

const magicNumber = 0x55aa55aa;
const VIDEO_FORMAT_H264 = 5;

const verifyMagicNumber = input => input.toString() === Number.parseInt(magicNumber).toString()
const verifyType = (type, check) => bignum(check).toString() === bignum(bignum(type).xor(-1)).and(0xffffffff).toString()

const len = x => x.toString().length
const add = parts => Buffer.concat([...parts])
const p = (f, d) => Buffer.from(struct.pack(f, d), 'binary')

// console.log(len(add([struct.pack('<LL', [0, 0])])))

const pack = (type, data) => {
	// console.log(len(data))
	return add([p("<LLLL", [magicNumber, len(data), type, long.fromString(bignum(bignum(type).xor(-1)).and(0xffffffff).toString())]), data])
}

const makeManufacturerInfo = () => {
	const data = p('<LL', [0, 0])
	return pack(20, data)
}

const makeFile = (filename, content) => {
	const actualFilename = String(filename + '\0')

	return pack(153, add([
		p("<L", len(actualFilename)),
		Buffer.from(actualFilename, 'ascii'),
		p("<L", len(content)),

		Buffer.from(content, 'binary')
	]))
}

const makeInt = (filename, value) => makeFile(filename, p('<L', value))
const makeString = (filename, value) => makeFile(filename, Buffer.from(value, 'ascii'))
const makeAsset = (filename) => makeFile('/tmp/' + filename, fs.readFileSync('assets/' + filename).toString('binary'))
const makeSetup = (width, height, fps, format) => pack(1, p("<LLLLLLL", [width, height, fps, format, 49152, 2, 2]))
const makeHeartbeat = () => pack(170, Buffer.from(''))
const makeEventTouchUp = (x, y) => pack(5, p("<LLLL", [16, x, y, 0]))
const makeEventTouchMove = (x, y) => pack(5, p("<LLLL", [15, x, y, 0]))
const makeEventTouchDown = (x, y) => pack(5, p("<LLLL", [14, x, y, 0]))

const allAssets = ["adb", "adb.pub", "helloworld0", "helloworld1", "helloworld2", "libby265n.so", "libby265n_x86.so", "libscreencap40.so", "libscreencap41.so", "libscreencap43.so", "libscreencap50.so", "libscreencap50_x86.so", "libscreencap442.so", "libscreencap422.so", "mirrorcoper.apk", "libscreencap60.so", "libscreencap70.so", "libscreencap71.so", "libscreencap80.so", "libscreencap90.so", "libscreencap100.so", "HWTouch.dex"];

const afterSetupInfo = [
	makeManufacturerInfo(),
	makeInt("/tmp/night_mode", 1),
	makeInt("/tmp/hand_drive_mode", 0),
	makeInt("/tmp/charge_mode", 0),
	makeString("/etc/box_name", 'RaptorKit'),
];
const startupInfo = [
	makeInt("/tmp/screen_dpi", 160),
	// makeAsset('adb'),
	// ...allAssets.map(asset => makeAsset(asset)),
	makeSetup(800, 600, 30, 5),
];

module.exports = {
	makeInt,
	makeString,
	makeAsset,
	makeSetup,
	makeFile,
	makeManufacturerInfo,
	makeHeartbeat,
	makeEventTouchUp,
	makeEventTouchDown,
	makeEventTouchMove,
	startupInfo,
	afterSetupInfo,
	verifyMagicNumber,
	verifyType,
	type: {
		SETUP: 1,
		CARPLAY: 8,
		CONNECTION: 2,
		PHASE: 3,
		DISCONNECTED: 4,
		VIDEO: 6,
		AUDIO: 7,
		DEVICE_NAME: 13,
		DEVICE_SSID: 14,
		KNOWN_DEVICES: 18,
		SOFTWARE_VERSION: 204,
	}
}
