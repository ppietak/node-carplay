const box = require('./box')
const input = require('./input')
const converter = require('./converter/fbdevConverter')

const os = require('os');
os.setPriority(os.constants.priority.PRIORITY_HIGHEST)

input.bus.on('touch_down', async (x, y) => {
	await box.sendTouchDown(x, y)
})
input.bus.on('touch_up', async (x, y) => {
	await box.sendTouchUp(x, y)
})

// keyboard.on('keypress', async ({code}) => {
// 	switch (code) {
// 		case 28:
// 			await box.sendButton(104)
// 			await box.sendButton(105)
// 			break
// 		case 105:
// 			await box.sendButton(100)
// 			break
// 		case 106:
// 			await box.sendButton(101)
// 			break
// 	}
// });

box.getVideoStream().pipe(converter.inputStream)
box.start(1280, 720)

const Speaker = require('speaker');
const stereoSpeaker = new Speaker({channels: 2, bitDepth: 16, sampleRate: 44100, device: 'plughw:2,0'});
// const monoSpeaker = new Speaker({channels: 1, bitDepth: 16, sampleRate: 16000, device: 'plughw:2,0'});

box.getAudioStereoStream().pipe(stereoSpeaker);
// box.getAudioMonoStream().pipe(monoSpeaker);
