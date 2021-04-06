const express = require('express');
const events = require('events');
const expressWebSocket = require('express-ws');
const websocketStream = require('websocket-stream/stream');
const cors = require('cors')
const stream = require('stream')

const WIDTH = 800
const HEIGHT = 600

const serverStream = new stream.PassThrough()
const bus = new events.EventEmitter();

const app = express();
app.use(cors())
app.use(express.static('public'))

expressWebSocket(app, null, {perMessageDeflate: false});

app.ws('/', function (ws, req) {
	console.log('= SERVER VIDEO REQUEST');

	const stream = websocketStream(ws, {binary: true});
	serverStream.pipe(stream)

	ws.on('message', (message) => {
		const type = String(message).slice(0, String(message).indexOf(','))

		switch (type) {
			case 'up': {
				const [t, x, y] = String(message).split(',')
				bus.emit('touch_up', Math.round(x * 10000 / WIDTH), Math.round(y * 10000 / HEIGHT))
				break;
			}
			case 'move': {
				const [t, x, y] = String(message).split(',')
				bus.emit('touch_move', Math.round(x * 10000 / WIDTH), Math.round(y * 10000 / HEIGHT))
				break;
			}
			case 'down': {
				const [t, x, y] = String(message).split(',')
				bus.emit('touch_down', Math.round(x * 10000 / WIDTH), Math.round(y * 10000 / HEIGHT))
				break;
			}
			case 'button': {
				const [t, code] = String(message).split(',')
				bus.emit('button', code)
				break;
			}
		}
	});
});

module.exports = {
	start: () => {
		app.listen(3000);
	},

	getServerStream: () => serverStream,
	getEventBus: () => bus,
}
