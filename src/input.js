const fs = require('fs')
const events = require('events')

const DEVICE_PATH = '/dev/input/mouse1';

const bus = new events.EventEmitter();

const touchscreenWidth = 1024, touchscreenHeight = 768
const targetWidth = 1280, targetHeight = 720

let currentX = touchscreenWidth / 2
let currentY = touchscreenHeight / 2

const parse = buf => ({
	t: buf.readInt8(0),
	x: buf.readInt8(1),
	y: buf.readInt8(2)
})

const input = fs.createReadStream(DEVICE_PATH, {flags: 'r'});

input.on('data', async (data) => {
	const event = parse(data);
	if (event.t === 8) {
		const x = Math.round(currentX * (targetWidth / touchscreenWidth))
		const y = Math.round(currentY * (targetHeight / touchscreenHeight))

		// console.log(x, y)
		bus.emit('touch_press', x, y)
	} else {
		currentX += event.x
		currentY -= event.y
	}
});

module.exports = {
	getEventBus: () => bus
}
