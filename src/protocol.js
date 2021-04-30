const { jspack } = require('jspack');
const fs = require('fs');

const MAGIC_CONST = 0x55aa55aa;

const verifyMagicConst = input => input.toString() === Number.parseInt(MAGIC_CONST).toString()
const verifyType = (type, check) => BigInt(check).toString() === (BigInt(type) ^ BigInt(-1) & BigInt(0xffffffff)).toString(10)

const len = x => x.toString().length
const asBinary = (f, d) => Buffer.from(jspack.Pack(f, d), 'binary')

const buildPacket = (type, payload) => {
	const checksum = (BigInt(type) ^ BigInt(-1) & BigInt(0xffffffff)).toString(10);
	const length = len(payload);
	return Buffer.concat([asBinary("<LLLL", [MAGIC_CONST, length, type, checksum]), payload])
}

const buildFilePacket = (filename, content) => {
	const actualFilename = String(filename + '\0')

	return buildPacket(153, Buffer.concat([
		asBinary("<L", len(actualFilename)),
		Buffer.from(actualFilename, 'ascii'),
		asBinary("<L", len(content)),
		Buffer.from(content, 'binary')
	]))
}

const makeManufacturerInfo = () => buildPacket(20, asBinary('<LL', [0, 0]))
const buildIntegerPacket = (filename, value) => buildFilePacket(filename, asBinary('<L', value))
const buildStringFilePacket = (filename, value) => buildFilePacket(filename, Buffer.from(value, 'ascii'))
const buildAssetFilePacket = (filename) => buildFilePacket('/tmp/' + filename, fs.readFileSync('assets/' + filename).toString('binary'))

const buildSetupPacket = (width, height, fps, format) => buildPacket(1, asBinary("<LLLLLLL", [width, height, fps, format, 49152, 2, 2]))
const buildHeartbeatPacket = () => buildPacket(170, Buffer.from(''))
const buildTouchPacket = (type, x, y) => buildPacket(5, asBinary("<LLLL", [type, x, y, 0]))
const buildButtonPacket = (code) => buildPacket(8, asBinary("<L", [code]))
const buildBluetoothPacket = (code) => buildPacket(10, asBinary("<L", [code]))
const buildAudioPacket = (data) => buildPacket(7, Buffer.concat([asBinary("<LfL", [5, 0.0, 3]), asBinary("<L", len(data)), Buffer.from(data, 'binary')]))

// const allAssets = ["adb", "adb.pub", "helloworld0", "helloworld1", "helloworld2", "libby265n.so", "libby265n_x86.so", "libscreencap40.so", "libscreencap41.so", "libscreencap43.so", "libscreencap50.so", "libscreencap50_x86.so", "libscreencap442.so", "libscreencap422.so", "mirrorcoper.apk", "libscreencap60.so", "libscreencap70.so", "libscreencap71.so", "libscreencap80.so", "libscreencap90.so", "libscreencap100.so", "HWTouch.dex"];

// const afterSetupInfo = [
// 	makeManufacturerInfo(),
// 	buildIntegerPacket("/tmp/night_mode", 1),
// 	buildIntegerPacket("/tmp/hand_drive_mode", 0),
// 	buildIntegerPacket("/tmp/charge_mode", 1),
// 	buildStringFilePacket("/etc/box_name", 'RaptorKit'),
// ];

module.exports = {
	buildHeartbeatPacket,
	buildTouchPacket,
	buildButtonPacket,
	buildSetupPacket,
	buildAudioPacket,
	buildBluetoothPacket,

	unpack: (format, vars) => jspack.Unpack(format, vars),
	unpackHeader: data => {
		if (data.length !== 16) {
			console.error('BAD HEADER LENGTH', data.length);
		}

		const [magicNumber, length, type, checksum] = jspack.Unpack('<LLLL', data)

		if (!verifyType(type, checksum)) {
			console.error('BAD HEADER TYPE', type, data.length, data);
			throw new Error('Invalid header')
		}

		if (!verifyMagicConst(magicNumber)) {
			console.error('BAD HEADER MAGIC NUMBER');
			throw new Error('Invalid header')
		}

		return [type, length]
	},

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
	audioCommand: {
		OUTPUT_START: 1,
		OUTPUT_STOP: 2,
		INPUT_CONFIG: 3,
		SIRI_START: 8,
		SIRI_STOP: 9,
	},
	audioType: {
		STEREO: 2,
		MONO: 5,
	},
	touch: {
		DOWN: 14,
		MOVE: 15,
		UP: 16,
	},
	button: {
		SIRI: [5, 6],
		LEFT: 100,
		RIGHT: 101,
		SELECT: [104, 105],
		BACK: 106,
		HOME: 200,
		PLAY: 201,
		PAUSE: 202,
		PLAY_OR_PAUSE: 203,
	},
}
