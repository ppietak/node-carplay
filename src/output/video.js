const childProcess = require('child_process');
const fs = require('fs');

const ffmpeg = childProcess.spawn("/usr/bin/ffmpeg", [
	'-hide_banner',
	'-i', '-',
	// '-threads', '8',
	// '-framerate', '30',
	// '-bufsize', '512',
	'-pix_fmt', 'rgb565le',
	'-f', 'fbdev', '/dev/fb0',
]);

ffmpeg.stderr.pipe(process.stdout)
ffmpeg.stdout.pipe(process.stdout)

module.exports = {
	output: ffmpeg.stdin
}
