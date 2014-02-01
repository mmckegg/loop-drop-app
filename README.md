Loop Drop
===

MIDI looper, modular synth and sampler app built around Novation Launchpad controller.

## Install

[Download and install the built Chrome App](https://docs.google.com/uc?export=download&id=0B02k4ZLTMC5DT1NzcHM0MlV6Rms)

(to install: Extract Zip. Open Chrome, then Window > Extensions. Drag "Loop Drop.crx" into the extension list. Go to chrome://flags/#enable-web-midi and enable Web Midi. Then open the installed Chrome App and navigate to "sample project".)

Or clone this repo and build your own.

```bash
$ git clone https://github.com/mmckegg/loop-drop-app
$ npm install # currently some of the deps aren't on npm, so this will fail :(
$ npm run build -w # build the chrome app and watch for changes
```

Then open chrome and go the the extensions tab. Tick the enable developer mode then 'Load Unpacked Extension' and navigate to 'loop-drop-app/build'.

**Okay you can't really install this quite yet, but I will get the packages on npm and upload a packaged chrome app soon!**

## What/How/Why is this thing?

Some people find writing and performing electronic music far too much like programming a computer and not enough like playing an instrument. So instead we **write software** that makes making music fun again! If we ever get around to finishing it that is...

## Modules

### Clock and Scheduling

- [bopper](https://github.com/mmckegg/bopper): Streaming clock source for scheduling Web Audio events rhythmically
- [ditty](https://github.com/mmckegg/ditty): Schedule playback for a loop sequence of Web Audio events (e.g. midi notes) using bopper clock source.

### Midi / Loop Recording

- [web-midi](https://github.com/mmckegg/web-midi): Web MIDI API stream based wrapper
- [midi-looper](https://github.com/mmckegg/midi-looper): Stream based midi loop maker. Buffers all input then creates loops on demand.
- [midi-looper-launchpad](https://github.com/mmckegg/midi-looper-launchpad): Launchpad control for midi-looper

### Sound, Sampling, Synthesis and FX

- [soundbank](https://github.com/mmckegg/soundbank): Web Audio API based sound slot player with basic editing
- [wave-recorder](https://github.com/mmckegg/wave-recorder): Pipe Web Audio API nodes into 16bit PCM Wave files.

soon:
- [wave-tape-loop](https://github.com/mmckegg/wave-tape-loop)
- [web-audio-rms](https://github.com/mmckegg/web-audio-rms)
