const events = require('events')
const InputEvent = require('input-event');

const DEVICE_PATH = '/dev/input/event1';

const input = new InputEvent(DEVICE_PATH);
const keyboard = new InputEvent.Keyboard(input);

const bus = new events.EventEmitter();

keyboard.on('keypress', async ({code}) => {
	bus.emit('key_press', code)
});

module.exports = {
	bus
}
