const stream = require('stream')
const childProcess = require('child_process')
const chunker = require('stream-chunker');

const RECORD_BUFFER_SIZE = 320 * 8;

const input = new stream.PassThrough()
const chunkedPassThrough = chunker(RECORD_BUFFER_SIZE)
chunkedPassThrough.pipe(input)

const start = () => childProcess.spawn("/usr/bin/arecord", [
	// '--device=plughw:2,0',
	// '--period-time=16000',
	'--file-type=wav',
	'--format=S16_LE',
	'--channels=1',
	'--rate=16000',
])

let record

module.exports = {
	input,
	startRecording: () => {
		record = start()
		record.stdout.pipe(chunkedPassThrough)
		record.stderr.pipe(process.stdout)
	},
	stopRecording: () => {
		record && record.stdout.unpipe(chunkedPassThrough)
		record && record.kill()
		record = undefined
	},
}
