loop-drop-app
===

MIDI looper, modular synth and sampler app built around Novation Launchpad controller.

## WORK IN PROGRESS

This branch is a complete rewrite of the user interface. It nearly ready for relase. See [master](https://github.com/mmckegg/loop-drop-app) for latest stable.

Needs the following features completed before merging to master:

  - Choose Project
  - Tempo Control
  - Display master volume output levels
  - Get qwerty keys working
  - and DOCUMENTATION (at least a helpful readme)

## Install

```bash
$ git clone https://github.com/mmckegg/loop-drop-app
$ npm install
$ npm run build # or npm run watch (to automatically rebuild) 
```

Then open chrome and go the the extensions tab. Tick the enable developer mode then **'Load Unpacked Extension'** and navigate to 'loop-drop-app/build' (the entire directory).

If you want to use it with Launchpad (WHICH YOU SHOULD!), you need to go to chrome://flags/#enable-web-midi and enable Web Midi. Then restart Chrome.

**When the app first launches, it will prompt you for a place to store its files. Create a directory somewhere useful and call it Loop Drop or something.**