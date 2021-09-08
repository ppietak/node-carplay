const childProcess = require('child_process');
const config = require('../config')
const logger = require('../logger')

const ffmpeg = childProcess.spawn("/usr/bin/ffmpeg", [
	'-hide_banner',
	'-i', '-',
	// '-threads', '8',
	// '-bufsize', '512',
	// '-pix_fmt', 'rgb565le', // framebuffer_depth 16 bit
	'-pix_fmt', 'bgra', // framebuffer_depth 32 bit
	'-f', 'fbdev', config.FRAME_BUFFER_DEViCE,
]);

// ffmpeg.stderr.on('data', logger.debug)
// ffmpeg.stdout.on('data', logger.debug)

module.exports = {
	output: ffmpeg.stdin
}
