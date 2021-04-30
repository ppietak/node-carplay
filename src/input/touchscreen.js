const fs = require('fs')
const events = require('events')

const DEVICE_PATH = '/dev/input/mouse0';
const INPUT_INTERVAL = 10;

const bus = new events.EventEmitter();

const touchscreenWidth = 1024, touchscreenHeight = 768
const targetWidth = 800, targetHeight = 600

let currentX = touchscreenWidth / 2
let currentY = touchscreenHeight / 2
let initialT = null
let initialX = null
let initialY = null
let shouldSendDown = false
let isMoving = false

const debounce = function(a,b,c){var d;return function(){var e=this,f=arguments;clearTimeout(d),d=setTimeout(function(){d=null,c||a.apply(e,f)},b),c&&!d&&a.apply(e,f)}}
const normalize = (x, y) => ([Math.round(x * (targetWidth / touchscreenWidth)), Math.round(y * (targetHeight / touchscreenHeight))])

const parse = buf => ({
	t: buf.readInt8(0),
	x: buf.readInt8(1),
	y: buf.readInt8(2)
})

const touchscreen = fs.createReadStream(DEVICE_PATH, {flags: 'r'});

const delay = debounce((t, x, y) => { bus.emit(t, ...normalize(x, y)) }, 50)
const delayInput = debounce((event) => {
	if (shouldSendDown) {
		bus.emit('touch_down', ...normalize(currentX, currentY))
		initialT = event.t
		initialX = currentX
		initialY = currentY
		shouldSendDown = false
	}
}, INPUT_INTERVAL);

touchscreen.on('data', async (data) => {
	const event = parse(data);

	currentX += event.x
	currentY -= event.y

	if (!initialT) {
		shouldSendDown = true
		delayInput(event)
	} else if (initialX !== currentX || initialY !== currentY) {
		bus.emit('touch_move', ...normalize(currentX, currentY))
		isMoving = true
	}

	if (event.t === 8) {
		if (initialT) {
			if (isMoving) {
				delay('touch_up', currentX, currentY)
				isMoving = false
			} else {
				bus.emit('touch_up', ...normalize(currentX, currentY))
			}
		}

		initialT = null
		initialX = null
		initialY = null
		shouldSendDown = false
	}
});

module.exports = {
	bus
}
