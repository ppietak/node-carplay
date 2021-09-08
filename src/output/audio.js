const childProcess = require('child_process')
const logger = require('../logger')

const startAplay = params => childProcess.spawn("/usr/bin/aplay", params)

const speakerStereo = startAplay([
	// '--device=plughw:2,0',
	// '--interactive',
	'--format=S16_LE',
	'--channels=2',
	'--rate=44100',
	'-q',
])
// speakerStereo.stderr.on('data', logger.debug)
// speakerStereo.stdout.on('data', logger.debug)
speakerStereo.on('error', async () => {
	logger.error('Could not load speaker stereo')
})

const speakerMono = startAplay([
	// '--device=plughw:2,0',
	// '--interactive',
	'--format=S16_LE',
	'--channels=1',
	'--rate=16000',
	'-q',
])
// speakerMono.stderr.on('data', logger.debug)
// speakerMono.stdout.on('data', logger.debug)
speakerMono.on('error', async () => {
	logger.error('Could not load speaker mono')
})

module.exports = {
	speakerStereo: speakerStereo.stdin,
	speakerMono: speakerMono.stdin,
}
