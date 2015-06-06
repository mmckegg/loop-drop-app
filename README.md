Loop Drop
===

MIDI looper, modular synth and sampler app built around Novation Launchpad controller.

## Need help?

Tweet [@MattMcKegg](https://twitter.com/MattMcKegg) or join irc channel #loopjs on freenode.

## Buy the packaged app (soon) ...

![](https://raw.githubusercontent.com/mmckegg/loop-drop-app/master/tile.png)

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

## Supported Controllers

- [Qwerty Keyboard](https://github.com/mmckegg/loop-qwerty)
- [Novation Launchpad](https://github.com/mmckegg/loop-launchpad)

**Still needs updating for v2:**

- [Akai MPK Mini](https://github.com/mmckegg/loop-mpkmini)
- [Akai APC Mini](https://github.com/fourseven/loop-apcmini)

If your controller isn't supported, copy one of the above controller bindings and modify to suit, then send a pull request!

## Getting Started

### Using with a Launchpad (or other midi controller)

> You may have to select your midi controller manually from the port selector if your system calls it something different.

Create a new setup. Click the `+ MIDI Controller` button and select Novation Launchpad (or whatever) from the first drop down. Then select the midi port your controller is connected to from the second drop down. If it is not showing up, try restarting Chrome.

At this point, your Launchpad hardware should light up, with a visual metronome ticking down the side.

To make it do anything, you'll need to create and drag in some chunks (see below).

Once you have some chunks loaded, you should be able to trigger sounds using the **main grid** on the Launchpad hardware that corresponds to the interface grid that you have added chunks to.

See [here](https://github.com/loopjs/loop-launchpad) for details of how to trigger and loop with the Novation Launchpad controller.

### Using with Qwerty Keys

If you don't have a Launchpad, you can still use Loop Drop (a little anyway).

Create a new setup, and click `+ controller`. Select Qwerty Keys from the first drop down.

Drag in the chunks from the sidebar that you want to be able to trigger and shape acordingly.

See [here](https://github.com/mmckegg/loop-qwerty) for how the keyboard controls map to the grid.

### Chunks

There are currently 3 types of chunks:
  - Triggers
  - Chromatic
  - Modulator

The first option allows you to choose a different sound for every button, whereas chromatic copies a single sound over all of the buttons in the chunk, but with a different note offset based on the global (or local) scale.
