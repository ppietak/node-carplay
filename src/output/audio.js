const stream = require('stream')
const childProcess = require('child_process')

const recordingStream = new stream.PassThrough()

const startAplay = params => childProcess.spawn("/usr/bin/aplay", params)
const startArecord = params => childProcess.spawn("/usr/bin/arecord", params)

const speakerStereo = startAplay([
	// '--device=plughw:2,0',
	'--interactive',
	'--format=S16_LE',
	'--channels=2',
	'--rate=44100',
])
// speakerStereo.stderr.pipe(process.stdout)

const speakerMono = startAplay([
	// '--device=plughw:2,0',
	'--interactive',
	'--format=S16_LE',
	'--channels=1',
	'--rate=16000',
])
// speakerStereo.stderr.pipe(process.stdout)

const microphoneParams = [
	// '--device=plughw:2,0',
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
		microphone.stdout.pipe(recordingStream)
		// microphone.stderr.pipe(process.stdout)
	},
	stopRecording: () => {
		microphone.stdout.unpipe(recordingStream)
		microphone.kill()
		microphone = undefined
	},
}
