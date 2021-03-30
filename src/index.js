const server = require('./server')
const converter = require('./converter')

const transport = require('./transport')
const {videoStream} = transport.start()
const {serverStream} = server.start()

videoStream.pipe(converter.inputStream)
converter.outputStream.pipe(serverStream)
