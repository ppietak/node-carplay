const events = require('events')
const InputEvent = require('input-event');
const config = require('../config')

let input, keyboard;

try {
	input = new InputEvent(config.KEYBOARD_DEVICE);
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
