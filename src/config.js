require('dotenv').config()

module.exports = {
	ENV: process.env.ENV,

	KEYBOARD_DEVICE: process.env.KEYBOARD_DEVICE,
	TOUCHSCREEN_DEVICE: process.env.TOUCHSCREEN_DEVICE,
	FRAME_BUFFER_DEViCE: process.env.FRAME_BUFFER_DEViCE,
}
