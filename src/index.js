const transport = require('./transport')
const converter = require('./converter/h264Converter')
const server = require('./server')

const {eventBus, serverStream} = server.start()
const {videoStream} = transport.start()
transport.handleEvents(eventBus)

videoStream.pipe(converter.inputStream)
converter.outputStream.pipe(serverStream)
