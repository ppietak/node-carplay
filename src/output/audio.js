const stream = require('stream')
const childProcess = require('child_process')
const chunker = require('stream-chunker');

const recordingStream = new stream.PassThrough()
const chunkedRecordingStream = chunker(320 * 8)
chunkedRecordingStream.pipe(recordingStream)

const startAplay = params => childProcess.spawn("/usr/bin/aplay", params)
const startArecord = params => childProcess.spawn("/usr/bin/arecord", params)

const speakerStereo = startAplay([
	// '--device=plughw:2,0',
	'--interactive',
	'--format=S16_LE',
	'--channels=2',
	'--rate=44100',
])
speakerStereo.stderr.pipe(process.stdout)
speakerStereo.stdout.pipe(process.stdout)

const speakerMono = startAplay([
	// '--device=plughw:2,0',
	'--interactive',
	'--format=S16_LE',
	'--channels=1',
	'--rate=16000',
])
speakerMono.stderr.pipe(process.stdout)
speakerMono.stdout.pipe(process.stdout)

const microphoneParams = [
	// '--device=plughw:2,0',
	// '--period-time=16000',
	'--file-type=raw',
	'--format=S16_LE',
	'--channels=1',
	'--rate=16000',
];

let microphone

module.exports = {
	speakerStereo: speakerStereo.stdin,
	speakerMono: speakerMono.stdin,
	microphone: recordingStream,
	startRecording: () => {
		microphone = startArecord(microphoneParams)
		// microphone.stdout.pipe(recordingStream)
		microphone.stdout.pipe(chunkedRecordingStream)
		microphone.stderr.pipe(process.stdout)
	},
	stopRecording: () => {
		microphone && microphone.stdout.unpipe(chunkedRecordingStream)
		microphone && microphone.kill()
		microphone = undefined
	},
}
