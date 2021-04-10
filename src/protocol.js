const struct = require('python-struct');
const fs = require('fs');

const magicNumber = 0x55aa55aa;

const verifyMagicNumber = input => input.toString() === Number.parseInt(magicNumber).toString()
const verifyType = (type, check) => BigInt(check).toString() === (BigInt(type) ^ BigInt(-1) & BigInt(0xffffffff)).toString(10)

const len = x => x.toString().length
const bin = (f, d) => Buffer.from(struct.pack(f, d), 'binary')

const pack = (type, data) => {
	const checksum = (BigInt(type) ^ BigInt(-1) & BigInt(0xffffffff)).toString(10);
	const length = len(data);
	return Buffer.concat([bin("<LLLL", [magicNumber, length, type, checksum]), data])
}

const makeFile = (filename, content) => {
	const actualFilename = String(filename + '\0')

	return pack(153, Buffer.concat([
		bin("<L", len(actualFilename)),
		Buffer.from(actualFilename, 'ascii'),
		bin("<L", len(content)),
		Buffer.from(content, 'binary')
	]))
}

const makeManufacturerInfo = () => pack(20, bin('<LL', [0, 0]))
const makeInt = (filename, value) => makeFile(filename, bin('<L', value))
const makeString = (filename, value) => makeFile(filename, Buffer.from(value, 'ascii'))
const makeAsset = (filename) => makeFile('/tmp/' + filename, fs.readFileSync('assets/' + filename).toString('binary'))
const makeSetup = (width, height, fps, format) => pack(1, bin("<LLLLLLL", [width, height, fps, format, 49152, 2, 2]))

const buildHeartbeatPacket = () => pack(170, Buffer.from(''))
const buildTouchPacket = (type, x, y) => pack(5, bin("<LLLL", [type, x, y, 0]))
const buildButtonPacket = (code) => pack(8, bin("<L", [code]))

const allAssets = ["adb", "adb.pub", "helloworld0", "helloworld1", "helloworld2", "libby265n.so", "libby265n_x86.so", "libscreencap40.so", "libscreencap41.so", "libscreencap43.so", "libscreencap50.so", "libscreencap50_x86.so", "libscreencap442.so", "libscreencap422.so", "mirrorcoper.apk", "libscreencap60.so", "libscreencap70.so", "libscreencap71.so", "libscreencap80.so", "libscreencap90.so", "libscreencap100.so", "HWTouch.dex"];

const afterSetupInfo = [
	makeManufacturerInfo(),
	makeInt("/tmp/night_mode", 1),
	makeInt("/tmp/hand_drive_mode", 0),
	makeInt("/tmp/charge_mode", 1),
	makeString("/etc/box_name", 'RaptorKit'),
];
const startupInfo = [
	makeInt("/tmp/screen_dpi", 160),
	// makeAsset('adb'),
	// ...allAssets.map(asset => makeAsset(asset)),
	makeSetup(1280, 720, 30, 5),
];

module.exports = {
	pack,
	unpack: (format, vars) => struct.unpack(format, vars),
	// makeInt,
	// makeString,
	// makeAsset,
	// makeSetup,
	// makeFile,
	// makeManufacturerInfo,
	buildHeartbeatPacket,
	buildTouchPacket,
	buildButtonPacket,
	startupInfo,
	afterSetupInfo,
	verifyMagicNumber,
	verifyType,
	type: {
		SETUP: 1,
		CONNECTION: 2,
		PHASE: 3,
		DISCONNECTED: 4,
		VIDEO: 6,
		AUDIO: 7,
		CARPLAY: 8,
		DEVICE_NAME: 13,
		DEVICE_SSID: 14,
		KNOWN_DEVICES: 18,
		SOFTWARE_VERSION: 204,

		TOUCH: 5,
		BUTTON: 8,
		HEARTBEAT: 170,
	},
	touch: {
		DOWN: 14,
		MOVE: 15,
		UP: 16,
	},
	button: {
		LEFT: 100,
		RIGHT: 101,
	},
}
