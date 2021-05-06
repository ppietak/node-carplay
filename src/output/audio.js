const childProcess = require('child_process')

const startAplay = params => childProcess.spawn("/usr/bin/aplay", params)

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

module.exports = {
	speakerStereo: speakerStereo.stdin,
	speakerMono: speakerMono.stdin,
}
