run: setup-video
	sudo node .

setup-video:
	fbset -fb /dev/fb0 -g 1280 720 1280 720 32

