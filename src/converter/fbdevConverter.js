const {PassThrough} = require('stream')
const childProcess = require('child_process');

const inputStream = new PassThrough()
const outputStream = new PassThrough()

const h264ToFbdev = [
	'-hide_banner',
	'-i', '-',
	'-threads', '4',
	'-pix_fmt',  'bgra',
	'-f', 'fbdev', '/dev/fb0',
];

let transcoder = childProcess.spawn("/usr/bin/ffmpeg", h264ToFbdev);

inputStream.pipe(transcoder.stdin)
// transcoder.stderr.pipe(process.stdout)

module.exports = {
	inputStream,
	outputStream,
}
