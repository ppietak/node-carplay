const {PassThrough} = require('stream')
const childProcess = require('child_process');

const inputStream = new PassThrough()
const outputStream = new PassThrough()

const h264ToH264 = [
	'-hide_banner',
	'-i', '-',
	'-threads', '8',
	// '-framerate', '5',
	'-movflags', 'frag_keyframe+empty_moov',
	// "-video_size", '800x600',
	'-vcodec', 'libx264',
	// '-vcodec', 'h264_omx',
	// '-vcodec', 'copy',
	// '-b:v', '1024k',
	// '-bufsize', '1024k',
	// '-pix_fmt',  'yuv420p', // unsupported
	'-vprofile', 'baseline',
	'-tune', 'zerolatency',
	'-f', 'rawvideo',
	'-',
];

let transcoder = childProcess.spawn("/usr/bin/ffmpeg", h264ToH264);

inputStream.pipe(transcoder.stdin)

// inputStream.on('data', console.log)
// transcoder.stdout.on('data', console.log)
// inputStream.on('data', d => process.stdout.write('-'))
// transcoder.stdout.on('data', d => process.stdout.write('+'))

transcoder.stdout.on('data', data => outputStream.write(data))
transcoder.stderr.pipe(process.stdout)

module.exports = {
	inputStream,
	outputStream,
}
