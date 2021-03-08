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

### Using with a launchpad

<div class='ImageSteps'>
  <img height="150" src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds02.jpg?raw=true' /> <img height="150" src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds03.jpg?raw=true' /> <img height="150"  src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds04.jpg?raw=true' />
</div>
          
Add as many Launchpad controllers as your need.</em><br/> Loop Drop supports the MK1, Mini, MK2 and Pro editions!

![](https://github.com/mmckegg/loopjs-www/blob/master/public/loop-drop-launchpad.png?raw=true)

<a href='https://www.youtube.com/channel/UC2wAgvZBPlRoqHRQ7vS0RZg'>📺 Check out the Loop Drop YouTube channel!</a> </br>
or Matt's <a href='https://www.youtube.com/channel/UCx4PC9z3Os2gp0BYfdUK07A'>personal YouTube channel</a> (full of Loop Drop gigs)

### Using with qwerty keys

To get the most out of Loop Drop, you should use it with a <em>hardware controller</em>, but you can <em>try it out</em> using your computer's <em>qwerty keyboard</em>.

![](https://github.com/mmckegg/loopjs-www/blob/master/public/loop-drop-qwerty.png?raw=true)

<em>Video:</em> <a href='https://www.youtube.com/watch?v=tOpbRsDwYH4'>Using Loop Drop with a Qwerty Keyboard</a>

### Loading <em>Audio Samples</em>

#### Create <em>Triggers Chunk</em> and <em>drag to controller</em>
<img height="150" src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds05.jpg?raw=true' /> <img height="150"  src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds07.jpg?raw=true' /> <img height="150"  src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds09.jpg?raw=true' />
<em>Trigger chunks are blocks of related sounds</em> e.g. drumkit, sliced sample, vocals, etc. They <em>must</em> be added to a controller before they do anything.


#### Select <em>shape</em> and <em>drag in audio samples</em>

<img height="150"  src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds11.jpg?raw=true' /> <img height="150"  src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds12.jpg?raw=true' /> <img height="150"  src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds13.jpg?raw=true' />

<em>Tip:</em> You can also manually add the slot, add a sample source, then click 'Choose File' to browse.

#### <em>Play!</em>

<img height="150"  src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds14.jpg?raw=true' /> <img height="150"  src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds15.jpg?raw=true' />

### <em>Synthesize!</em>

#### Create <em>Chromatic Chunk</em> and <em>drag to controller</em>

<img height="150"  src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds16.jpg?raw=true' /> <img height="150"  src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds18.jpg?raw=true' /> <img height="150"  src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds19.jpg?raw=true' />

<em>Chromatic chunks are like trigger chunks, except that they only have one editable trigger ('template').</em><br/> This is repeated for all triggers in the block, except that the pitch increases chromatically. You can create pitched instruments using samples or synthesis.

#### Add <em>Oscillators</em> and tweak<
      
<img height="150" src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds20.jpg?raw=true' /> <img height="150" src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds25.jpg?raw=true' /> <img height="150" src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds23.jpg?raw=true' />

Clicking <em>ENV</em> adds an <em>ADSR</em> (attack, decay, sustain, release) envelope to the chosen param.

#### Choose <em>Output Effects</em></h1>

<img height="150" src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds26.jpg?raw=true' /> <img height="150" src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds27.jpg?raw=true' /> <img height="150" src='https://github.com/mmckegg/loopjs-www/blob/master/public/image-steps/sounds32.jpg?raw=true' />

<em>Tip:</em> Effects like 'reverb' should be added to the 'Output' slot instead of the triggers to avoid unnecessary CPU usage.

## Build and Install from source

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
