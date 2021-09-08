const config = require('./config')

module.exports = {
	info: (...message) => {
		console.log(...message);
	},
	error: (...message) => {
		console.error(...message);
	},
	debug: (...message) => {
		if (config.ENV === 'dev') {
			console.debug(...message);
		}
	},
}
