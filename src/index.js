const box = require('./box')
const touchscreen = require('./input/touchscreen')
const keyboard = require('./input/keyboard')
const converter = require('./converter/fbdevConverter')

const os = require('os');
os.setPriority(os.constants.priority.PRIORITY_HIGHEST)

touchscreen.bus.on('touch_down', async (x, y) => {
	await box.sendTouchDown(x, y)
})
touchscreen.bus.on('touch_up', async (x, y) => {
	await box.sendTouchUp(x, y)
})
keyboard.bus.on('key_press', async (code) => {
	switch (code) {
		case 28: // select
			await box.sendButton(box.button.SELECT[0])
			await box.sendButton(box.button.SELECT[1])
			break
		case 105: // left
			await box.sendButton(box.button.LEFT)
			break
		case 106: // right
			await box.sendButton(box.button.RIGHT)
			break
		case 59: // siri
			await box.sendButton(box.button.SIRI[0])
			await box.sendButton(box.button.SIRI[1])
			break
		case 104: // home
			await box.sendButton(box.button.HOME)
			break
		case 14: // back
			await box.sendButton(box.button.BACK)
			break
		case 10000: // play
			await box.sendButton(box.button.PLAY)
			break
		case 100001: // pause
			await box.sendButton(box.button.PAUSE)
			break
		case 1000011: // play or pause
			await box.sendButton(box.button.PLAY_OR_PAUSE)
			break
	}
})

box.getVideoStream().pipe(converter.inputStream)
box.start(1280, 720)

// const Speaker = require('speaker');
//
// box.getEventBus().on('audio_stereo_start', () => {
// 	speaker = new Speaker({channels: 2, bitDepth: 16, sampleRate: 44100, device: 'plughw:2,0'})
// })
// box.getEventBus().on('audio_mono_start', () => {
// 	speaker = new Speaker({channels: 1, bitDepth: 16, sampleRate: 16000, device: 'plughw:2,0'});
// })
// box.getEventBus().on('audio_stereo_stop', () => {
// 	speaker.close()
// 	speaker = undefined
// })
// box.getEventBus().on('audio_mono_stop', () => {
// 	speaker.close()
// 	speaker = undefined
// })
//
// box.getAudioStream().pipe(speaker);
