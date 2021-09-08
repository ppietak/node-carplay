make install

cat res/boot-config-txt | sudo tee -a /boot/config.txt > /dev/null



- if received resolution from box doesn't change - unplug and plug again


### Audio

Set default audio device in `/usr/share/alsa/alsa.conf`

```
defaults.ctl.card 1
defaults.pcm.card 1
```
