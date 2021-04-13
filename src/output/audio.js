const childProcess = require('child_process')

const stereoParams = [
	// '--device=plughw:2,0',
	'--interactive',
	'--format=S16_LE',
	'--channels=2',
	'--rate=44100',
];

const monoParams = [
	// '--device=plughw:2,0',
	'--interactive',
	'--format=S16_LE',
	'--channels=1',
	'--rate=16000',
];

const start = params => childProcess.spawn("/usr/bin/aplay", params)

const stereo = start(stereoParams)
// stereo.stderr.pipe(process.stdout)

const mono = start(monoParams)
// mono.stderr.pipe(process.stdout)

module.exports = {
	stereoOutput: stereo.stdin,
	monoOutput: mono.stdin,
}
