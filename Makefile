run:
	sudo /home/pi/.nvm/versions/node/v12.22.1/bin/node .

setup-video:
	fbset -fb /dev/fb0 -g 1280 720 1280 720 32

