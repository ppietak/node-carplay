const express = require('express');
const expressWebSocket = require('express-ws');
const websocketStream = require('websocket-stream/stream');
const cors = require('cors')
const stream = require('stream')

const serverStream = new stream.PassThrough()
const app = express();
app.use(cors())

expressWebSocket(app, null, {perMessageDeflate: false});

app.ws('/video', function (ws, req) {
	console.log('= SERVER VIDEO REQUEST');

	const stream = websocketStream(ws);
	serverStream.pipe(stream)
});

module.exports = {
	start: () => {
		app.listen(3000);

		return {serverStream}
	}
}
