const {PassThrough} = require('stream')
const childProcess = require('child_process');

const inputStream = new PassThrough()
const outputStream = new PassThrough()

let ffmpeg = childProcess.spawn("/usr/bin/ffmpeg", ['-hide_banner', '-i', '-', '-threads', '8', '-pix_fmt',  'bgra', '-f', 'fbdev', '/dev/fb0']);

inputStream.pipe(ffmpeg.stdin)

// ffmpeg.stderr.pipe(process.stdout)

module.exports = {
	inputStream,
	outputStream,
}
