setup-video:
	cat res/boot-config-txt | sudo tee -a /boot/config.txt > /dev/null
# 	fbset -fb /dev/fb0 -g 1280 720 1280 720 32
# 	fbset -fb /dev/fb0 -g 800 480 800 480 32
# 	fbset -fb /dev/fb0 -g 1024 768 1024 768 32
# 	fbset -fb /dev/fb0 -g 1024 600 1024 600 32
#sudo fbi -d /dev/fb0 -T 1 res/1280x720.png

run:
	@sudo node .

img:
	sudo fbi -d /dev/fb0 -T 1 res/1280x720.png

install:
	sudo apt update --allow-releaseinfo-change --fix-missing
	sudo apt install nodejs npm ffmpeg libusb-dev libudev-dev -y
	#xserver-xorg-input-libinput


	npm install
