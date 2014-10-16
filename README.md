Loop Drop
===

MIDI looper, modular synth and sampler app built around Novation Launchpad controller.

**Preview the new version here:** https://github.com/mmckegg/loop-drop-app/tree/global-setups

## Install

```bash
$ git clone https://github.com/mmckegg/loop-drop-app
$ npm install
$ npm run build # or npm run watch (to automatically rebuild) 
```

Then open chrome and go the the extensions tab. Tick the enable developer mode then **'Load Unpacked Extension'** and navigate to 'loop-drop-app/build' (the entire directory).

If you want to use it with Launchpad (WHICH YOU SHOULD!), you need to go to chrome://flags/#enable-web-midi and enable Web Midi. Then restart Chrome.

**When the app first launches, it will prompt you for a place to store its files. Create a directory somewhere useful and call it Loop Drop or something.** Or [clone the sample project](https://github.com/mmckegg/loop-drop-sample-project) and point at that.

## What/How/Why is this thing?

Some people find writing and performing electronic music far too much like programming a computer and not enough like playing an instrument. So instead we **write software** that makes making music fun again! If we ever get around to finishing it that is...

### Use it with [Novation Launchpad](http://us.novationmusic.com/midi-controllers-digital-dj/launchpad)

For (somewhat) detailed Launchpad controller info see [the usage notes on the midi-looper-launchpad module](https://github.com/mmckegg/midi-looper-launchpad#usage).

If you are using it with a Launchpad Mini, you will have to modify the code that initializes the Launchpad connection [behaviors/engine.js:41](https://github.com/mmckegg/loop-drop-app/blob/master/behaviors/engine.js#L41) to look for `"Launchpad Mini"` instead.

### Using without a Launchpad

Very simplistic 'computer keyboard' controls have been implemented. 

You get the first 3 lines of the soundbank grid. You can move the target up and down using `-` and `=` keys

```
Q W E R T Y U O
A S D F G H J K
Z X C V B N M ,
```

`Enter` loops the events currently in buffer, and `Backspace` undoes the last loop.

`SHIFT+SPACE` switches to the other soundbank deck.

By default, it is in repeat mode which means you have to hold down the key to hear a sound. By default it triggers on each beat. You can change the repeat length by using 1-8 number keys across the top of keyboard. Press `~` to disable repeat and free-play.

### Implement your own controller

YES DO IT!

## Connect Instances

Use [loop-drop-server](https://github.com/mmckegg/loop-drop-server) to connect and sync multiple instances of Loop Drop together over a local network or via internet.

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
