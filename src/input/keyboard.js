const events = require('events')
const InputEvent = require('input-event');

const DEVICE_PATH = '/dev/input/event1';
let input, keyboard;

try {
	input = new InputEvent(DEVICE_PATH);
	keyboard = new InputEvent.Keyboard(input);
} catch (e) {
}

const bus = new events.EventEmitter();

keyboard && keyboard.on('keypress', async ({code}) => {
	bus.emit('key_press', code)
});

module.exports = {
	bus
}
