setup-video:
	cat res/boot-config-txt | sudo tee -a /boot/config.txt > /dev/null
# 	fbset -fb /dev/fb0 -g 1280 720 1280 720 32

install:
	sudo apt update --allow-releaseinfo-change --fix-missing
	sudo apt install nodejs npm ffmpeg libusb-dev libudev-dev -y


	npm install
