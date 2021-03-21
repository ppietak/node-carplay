const struct = require('python-struct');
const bignum = require('bignum');
const long = require('long');
const fs = require('fs');

const len = x => x.toString().length
const add = parts => Buffer.concat([...parts])
const p = (f, d) => Buffer.from(struct.pack(f, d), 'binary')

// console.log(len(add([struct.pack('<LL', [0, 0])])))

const pack = (type, data) => {
	// console.log(len(data))
	return add([p("<LLLL", [0x55aa55aa, len(data), type, long.fromString(bignum(bignum(type).xor(-1)).and(0xffffffff).toString())]), data])
}

const ManufacturerInfo = () => {
	const data = p('<LL', [0, 0])
	return pack(20, data)
}

const SendFile = (filename, content) => {
	const actualFilename = String(filename + '\0')

	return pack(153, add([
		p("<L", len(actualFilename)),
		Buffer.from(actualFilename, 'ascii'),
		p("<L", len(content)),
		Buffer.from(content, 'binary')
	]))
}

const SendInt = (filename, value) => SendFile(filename, p('<L', value))
const SendString = (filename, value) => SendFile(filename, Buffer.from(value, 'ascii'))
const CopyAsset = (filename) => SendFile('/tmp/' + filename, fs.readFileSync('assets/' + filename).toString('binary'))
const Open = (width, height, fps) => pack(1, p("<LLLLLLL", [width, height, fps, 5, 49152, 2, 2]))

// const openedInfo = [
// 	ManufacturerInfo(),
// 	SendInt("/tmp/night_mode", 0),
// 	SendInt("/tmp/hand_drive_mode", 0),
// 	SendInt("/tmp/charge_mode", 0),
// 	SendString("/etc/box_name", 'Teslabox'),
// ];
// const startupInfo = [
// 	ManufacturerInfo(),
// 	SendInt("/tmp/screen_dpi", 160),
// 	CopyAsset('adb'),
// 	Open(800, 600, 30),
// ];

// console.log(Manu().toString('base64'));
// console.log(SendInt('/tmp/screen_dpi', 160).toString('base64'));
// console.log(SendString('/etc/box_name', 'Teslabox').toString('base64'));
const actual = Open(800, 600, 30);
const expected = Buffer.from('\xaaU\xaaU\x1c\x00\x00\x00\x01\x00\x00\x00\xfe\xff\xff\xff \x03\x00\x00X\x02\x00\x00\x1e\x00\x00\x00\x05\x00\x00\x00\x00\xc0\x00\x00\x02\x00\x00\x00\x02\x00\x00\x00', 'binary');

console.log(actual.toString('base64'));
console.log(expected.toString('base64'));
console.log(actual.toString() === expected.toString());

// console.log(Buffer.from('qlWqVQgAAAAUAAAA6////wAAAAAAAAAA', 'base64'))
// console.log('qlWqVRwAAACZAAAAZv///xAAAAAvdG1wL3NjcmVlbl9kcGkABAAAAKAAAAA=') // screendpi
// console.log('qlWqVQgAAAAUAAAA6////wAAAAAAAAAA') // manu
