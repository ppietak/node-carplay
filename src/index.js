const box = require('./box')
const input = require('./input')
const converter = require('./converter/fbdevConverter')

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
