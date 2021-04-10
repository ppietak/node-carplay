const box = require('./box')
const input = require('./input')
const converter = require('./converter/fbdevConverter')

input.getEventBus().on('touch_press', async (x, y) => {
	const x1 = Math.round(x/1280*10000);
	const y1 = Math.round(y/720*10000);
	await box.sendTouchDown(x1, y1)
	await new Promise(res => setTimeout(res, 150))
	await box.sendTouchUp(x1, y1)
})

// const InputEvent = require('input-event');
// const mouse = new InputEvent.Mouse(new InputEvent('/dev/input/mouse1'));
// // const keyboard = new InputEvent.Keyboard(new InputEvent('/dev/input/event0'));
//
// function debounce(a,b,c){var d;return function(){var e=this,f=arguments;clearTimeout(d),d=setTimeout(function(){d=null,c||a.apply(e,f)},b),c&&!d&&a.apply(e,f)}}
//
//
// let d = debounce(async () => {
// 	const ix = Math.round((x * 10000) / (width2/width));
// 	const iy = Math.round((y * 10000) / (height2/height));
// 	// console.log(ix, iy)
// 	// console.log(Math.round((x * 1)), Math.round((y * 1)))
// 	await box.sendTouchDown(ix, iy)
// 	await new Promise(res => setTimeout(res, 100))
// 	await box.sendTouchUp(ix, iy)
// }, 100)
//
// mouse.on('keypress', (event) => {
// 	x += event.x
// 	y -= event.y
// 	d()
// });

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
box.start()
