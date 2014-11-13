loop-drop-app
===

MIDI looper, modular synth and sampler app built around Novation Launchpad controller.

## Build and Install from source

```bash
$ git clone https://github.com/mmckegg/loop-drop-app
$ cd loop-drop-app
$ npm install
$ npm run build # or npm run watch (to automatically rebuild) 
```

Then open chrome and go the the extensions tab. Tick the enable developer mode then **'Load Unpacked Extension'** and navigate to 'loop-drop-app/build' (the entire directory).

If you want to use it with Launchpad (WHICH YOU SHOULD!), you need to go to chrome://flags/#enable-web-midi and enable Web Midi. Then restart Chrome.

**When the app first launches, it will prompt you for a place to store its files. Create a directory somewhere useful and call it Loop Drop or something.**

## Get it on the Chrome Webstore (soon)

## Supported Controllers

- [Qwerty Keyboard](https://github.com/mmckegg/loop-qwerty)
- [Novation Launchpad](https://github.com/mmckegg/loop-launchpad)
- [Akai MPK Mini](https://github.com/mmckegg/loop-mpkmini)
- [Akai APC Mini](https://github.com/fourseven/loop-apcmini)

If your controller isn't supported, copy one of the above controller bindings and modify to suit, then send a pull request!
