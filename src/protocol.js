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
const buildIntegerFilePacket = (filename, value) => buildFilePacket(filename, asBinary('<L', value))
const buildStringFilePacket = (filename, value) => buildFilePacket(filename, Buffer.from(value, 'ascii'))
const buildAssetFilePacket = (filename) => buildFilePacket('/tmp/' + filename, fs.readFileSync('assets/' + filename).toString('binary'))

const buildSetupPacket = (width, height, fps, format) => buildPacket(1, asBinary("<LLLLLLL", [width, height, fps, format, 49152, 2, 2]))
const buildHeartbeatPacket = () => buildPacket(170, Buffer.from(''))
const buildTouchPacket = (type, x, y) => buildPacket(5, asBinary("<LLLL", [type, x, y, 0]))
const buildCarplayPacket = (code) => buildPacket(8, asBinary("<L", [code]))
const buildBluetoothPacket = (code) => buildPacket(10, Buffer.from(String(code), 'ascii'))
const buildAudioPacket = (data) => buildPacket(7, Buffer.concat([asBinary("<LfL", [5, 0.0, 3]), data]))

module.exports = {
	buildIntegerFilePacket,
	buildStringFilePacket,
	buildHeartbeatPacket,
	buildTouchPacket,
	buildSetupPacket,
	buildCarplayPacket,
	buildAudioPacket,
	buildBluetoothPacket,

	unpack: (format, vars) => jspack.Unpack(format, vars),
	unpackHeader: data => {
		if (!data) {
			console.error('BAD HEADER');
			throw new Error('Invalid header')
		}

		if (data.length !== 16) {
			console.error('BAD HEADER LENGTH', data.length);
			throw new Error('Invalid header')
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
	carplay: {
		SIRI: [5, 6],
		LEFT: 100,
		RIGHT: 101,
		SELECT: [104, 105],
		BACK: 106,
		HOME: 200,
		PLAY: 201,
		PAUSE: 202,
		PLAY_OR_PAUSE: 203,
		AUTO_CONNECT: 1002,
	},
	// carplay cmd 3 - clicked logo icon
	// carplay cmd 4 - starting
}
