Loop Drop
===

MIDI looper, modular synth and sampler app built around Novation Launchpad controller. 

Written in **JavaScript** and powered by [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), [Web MIDI](https://webaudio.github.io/web-midi-api/), and [electron](http://electron.atom.io/).

## Overview

- [Watch a video of Loop Drop in action](https://www.youtube.com/watch?v=EBkmdNDIR6E)
- [Visit the website](http://loopjs.com)

#### Create sounds and load samples

Drop them where you want on your controllers then start jamming!

#### Everything you play is recorded.

Hit the loop button at any time. Whatever you just played will start to loop!

#### Play to the beat.
            
Use beat repeat and hold down buttons to trigger at different rates relative to tempo.

#### Transform your loops while they play.

Select, move, repeat, suppress. All using your hardware controller.


## Download the app and get help at [loopjs.com](http://loopjs.com)

[![](http://loopjs.com/loop-drop-with-launchpads.jpg)](http://loopjs.com)

## ...or Build and Install from source

```bash
$ git clone https://github.com/mmckegg/loop-drop-app
$ cd loop-drop-app
$ npm install
$ npm start
```

### Installing updates

New versions are being pushed out all the time. To update:

```bash
$ git pull
$ npm update
$ npm start
```

### You can also install via [npm](https://www.npmjs.com/package/loop-drop)

```bash
$ npm install -g loop-drop 
$ loop-drop

# install update
$ npm update -g loop-drop 
```

## Supported Controllers

- [Qwerty Keyboard](https://github.com/mmckegg/loop-qwerty)
- [Novation Launchpad](https://github.com/mmckegg/loop-launchpad)

If your controller isn't supported, copy one of the above controller bindings and modify to suit, then send a pull request!

## Module Overview

- [bopper](https://github.com/wavejs/bopper)
- [ditty](https://github.com/wavejs/ditty)
- [audio-slot](https://github.com/mmckegg/audio-slot)
- [loop-drop-setup](https://github.com/mmckegg/loop-drop-setup)
- [loop-drop-project](https://github.com/mmckegg/loop-drop-project)
- [wave-recorder](https://github.com/mmckegg/audio-slot)
- [mercury](https://github.com/raynos/mercury)
- [micro-css](https://github.com/mmckegg/micro-css)
- [electron](https://github.com/atom/electron)
