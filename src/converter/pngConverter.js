const {PassThrough} = require('stream')
const childProcess = require('child_process');

const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const jpegHeader = new Uint8Array([0xFF, 0xD8]);

const inputStream = new PassThrough()
const outputStream = new PassThrough()

const h264ToPng = [
	'-hide_banner',
	'-i', '-',
	'-threads', '1',
	'-vf', 'fps=15',
	'-vcodec', 'png',
	'-f', 'image2pipe',
	'-',
];

let transcoder = childProcess.spawn("/usr/bin/ffmpeg", h264ToPng);

inputStream.pipe(transcoder.stdin)

let buff = Buffer.from('', 'binary')

transcoder.stderr.pipe(process.stdout)
transcoder.stdout.on('data', data => {
	// console.log(data)

	if (data.indexOf(pngHeader) === 0) {
		if (buff.byteLength > 0) {
			outputStream.write(buff.toString('base64'))
			buff = Buffer.from('', 'binary')
		}
	}

	buff = Buffer.concat([buff, data])
})

module.exports = {
	inputStream,
	outputStream,
}
