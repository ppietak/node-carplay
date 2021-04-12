const childProcess = require('child_process');

const ffmpeg = childProcess.spawn("/usr/bin/ffmpeg", [
	'-hide_banner', '-i', '-',
	// '-threads', '8',
	// '-framerate', '30',
	'-bufsize', '256',
	'-pix_fmt', 'bgra',
	'-f', 'fbdev', '/dev/fb0',
]);

ffmpeg.stderr.pipe(process.stdout)

module.exports = {
	output: ffmpeg.stdin
}
