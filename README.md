Loop Drop
===

MIDI looper, modular synth and sampler app built around Novation Launchpad controller.

Written in **JavaScript** and powered by [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), [Web MIDI](https://webaudio.github.io/web-midi-api/), and [electron](http://electron.atom.io/).

## Overview

- [Watch a video of Loop Drop in action](https://www.youtube.com/watch?v=EBkmdNDIR6E)
- [Visit the website](http://loopjs.com)
- [Listen to music created with Loop Drop!](https://soundcloud.com/destroy-with-science)
- [Support this project on Patreon](https://www.patreon.com/MattMcKegg) 💖

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
$ git clone https://github.com/mmckegg/loop-drop-app.git
$ cd loop-drop-app
$ npm install
$ npm start
```

### Troubleshooting

If you receive an error on start up about missing `lib/*`, you may have to [run the following as administrator](http://www.howtogeek.com/howto/windows-vista/run-a-command-as-administrator-from-the-windows-vista-run-box/):

#### Windows

```bash
# run admin
$ node scripts/link-lib.js
```

#### Linux

```bash
$ sudo node scripts/link-lib.js
```

If it still doesn't work, try copying the `/lib` folder into `/node_modules`.

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

More controllers will be supported soon. **Pull requests accepted!**

### Qwerty Keyboard

![](http://loopjs.com/loop-drop-qwerty.png)

[Watch "Using Loop Drop with a Qwerty Keyboard" on YouTube](http://youtu.be/tOpbRsDwYH4)

### Novation Launchpad

![](http://loopjs.com/loop-drop-launchpad.png)

### Ableton Push (experimental)

https://www.youtube.com/watch?v=2oVcNaDpPz0

## Module Overview

- [loop-grid](https://github.com/mmckegg/loop-grid)
- [audio-slot](https://github.com/mmckegg/audio-slot)
- [wave-recorder](https://github.com/mmckegg/wave-recorder)
- [web-midi](https://github.com/mmckegg/web-midi)
- [bopper](https://github.com/wavejs/bopper)
- [micro-css](https://github.com/mmckegg/micro-css)
- [mutant](https://github.com/mmckegg/mutant)
- [observ-fs](https://github.com/mmckegg/observ-fs)
- [observ-midi](https://github.com/mmckegg/observ-midi)
- [electron](https://github.com/atom/electron)

## License

[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)
