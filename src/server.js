const express = require('express');
const events = require('events');
const expressWebSocket = require('express-ws');
const websocketStream = require('websocket-stream/stream');
const cors = require('cors')
const stream = require('stream')

const serverStream = new stream.PassThrough()
const eventBus = new events.EventEmitter();

const app = express();
app.use(cors())
app.use(express.static('public'))

expressWebSocket(app, null, {perMessageDeflate: false});

app.ws('/', function (ws, req) {
	console.log('= SERVER VIDEO REQUEST');

	const stream = websocketStream(ws, {binary: true});
	serverStream.pipe(stream)

	ws.on('message', (event) => {
		const [type, initialX, initialY] = String(event).split(',')
		const x = Math.round(initialX * 10000 / 800)
		const y = Math.round(initialY * 10000 / 600)

		switch (type) {
			case 'up': eventBus.emit('touch_up', x, y)
				break;
			case 'move': eventBus.emit('touch_move', x, y)
				break;
			case 'down': eventBus.emit('touch_down', x, y)
				break;
		}
	});
});

module.exports = {
	start: () => {
		app.listen(3000);

		return {eventBus, serverStream}
	}
}
