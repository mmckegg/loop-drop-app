Loop Drop
===

MIDI looper, modular synth and sampler app built around Novation Launchpad controller.

Written in **JavaScript** and powered by [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), [Web MIDI](https://webaudio.github.io/web-midi-api/), and [electron](http://electron.atom.io/).

## Currently Unmaintained

I'm taking a (possibly permanent) break from this project. My efforts are now mostly focused on a [hardware only version of this project](https://github.com/mmckegg/rust-loop-drop) for my own personal use.

The latest master is more recent than the releases, so I suggest that if you can, install from source! (master includes Ableton Link support and midi outputs).

I put a lot of work into this project over the years, but it was always a struggle trying to get Web Audio to work the way I wanted. That combined with trying to also make this an app for other people to use, took up way to much energy. I just want to get back to making music. 

So long, and thanks for all the fish. :heart:

## Overview

- [Watch a video of Loop Drop in action](https://www.youtube.com/watch?v=EBkmdNDIR6E)
- [Listen to music created with Loop Drop!](https://soundcloud.com/destroy-with-science)

#### Create sounds and load samples

Drop them where you want on your controllers then start jamming!

#### Everything you play is recorded.

Hit the loop button at any time. Whatever you just played will start to loop!

#### Play to the beat.

Use beat repeat and hold down buttons to trigger at different rates relative to tempo.

#### Transform your loops while they play.

Select, move, repeat, suppress. All using your hardware controller.


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

## Module Overview

- [electron](https://github.com/atom/electron)
- [mutant](https://github.com/mmckegg/mutant)
- [micro-css](https://github.com/mmckegg/micro-css)
- [web-midi](https://github.com/mmckegg/web-midi)
- [wave-recorder](https://github.com/mmckegg/wave-recorder)
- [bopper](https://github.com/wavejs/bopper)

## License

[AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html)
