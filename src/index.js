const InputEvent = require('input-event');

const box = require('./box')
const converter = require('./converter/fbdevConverter')
const server = require('./server')

const input = new InputEvent('/dev/input/event0');
const keyboard = new InputEvent.Keyboard(input);

keyboard.on('keypress', async ({code}) => {
	switch (code) {
		case 28:
			await box.sendButton(104)
			await box.sendButton(105)
			break
		case 105:
			await box.sendButton(100)
			break
		case 106:
			await box.sendButton(101)
			break
	}
});

box.start()
box.getVideoStream().pipe(converter.inputStream)

// server.start()
// server.getEventBus().on('touch_up', (x, y) => {
// 	box.sendTouchUp(x, y)
// })
// server.getEventBus().on('touch_move', (x, y) => {
// 	box.sendTouchMove(x, y)
// })
// server.getEventBus().on('touch_down', (x, y) => {
// 	box.sendTouchDown(x, y)
// })
// server.getEventBus().on('button', (code) => {
// 	box.sendButton(code)
// })
// converter.outputStream.pipe(server.getServerStream())
