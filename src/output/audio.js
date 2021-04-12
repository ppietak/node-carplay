const childProcess = require('child_process');

const aplay = childProcess.spawn("/usr/bin/aplay", [
	'--device=plughw:2,0',
	'--interactive',
	'--format=S16_LE',
	'--channels=2',
	'--rate=44100',
]);

aplay.stderr.pipe(process.stdout)

module.exports = {
	output: aplay.stdin
}
