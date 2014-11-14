Loop Drop
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

### Installing updates

New versions are being pushed out all the time. To update:

```bash
$ git pull
$ npm install
$ npm run build # if you are not already running npm run watch
```

## Get it on the Chrome Webstore (soon)

I have to design a shiny icon first. And fix more bugs :/

## Supported Controllers

- [Qwerty Keyboard](https://github.com/mmckegg/loop-qwerty)
- [Novation Launchpad](https://github.com/mmckegg/loop-launchpad)
- [Akai MPK Mini](https://github.com/mmckegg/loop-mpkmini)
- [Akai APC Mini](https://github.com/fourseven/loop-apcmini)

If your controller isn't supported, copy one of the above controller bindings and modify to suit, then send a pull request!

## Getting Started

You can clone the [sample project](https://github.com/mmckegg/loop-drop-sample-project) and load that to help with getting started.

### Using with a Launchpad (or other midi controller)

Currently, Chrome doesn't detect when midi controllers are plugged in, so you have to restart Chrome (completely, not just the Chrome App) each time after you have plugged in the controller. This will be sorted soon (see  https://code.google.com/p/chromium/issues/detail?id=279097)

Now create a new setup. Click the `+ controller` button and select Novation Launchpad (or whatever) from the first drop down. Then select the midi port your controller is connected to from the second drop down. If it is not showing up, try restarting Chrome.

At this point, your Launchpad hardware should light up, with a visual metronome ticking down the side.

To make it do anything, you'll need to create and drag in some chunks (see below).

Once you have some chunks loaded, you should be able to trigger sounds using the **main grid** on the Launchpad hardware that corresponds to the interface grid that you have added chunks to.

See [here](https://github.com/mmckegg/loop-qwerty) for details of how to trigger and loop with the Novation Launchpad controller.

### Using with Qwerty Keys

If you don't have a Launchpad, you can still use Loop Drop (a little anyway).

Create a new setup, and click `+ controller`. Select Qwerty Keys from the first drop down.

Drag in the chunks from the sidebar that you want to be able to trigger and shape acordingly.

See [here](https://github.com/mmckegg/loop-qwerty) for how the keyboard controls map to the grid.

### Chunks

There are currently two types of chunks (that can be selected using the first drop down):
  - Chunk
  - Inherit Range

The first option allows you to choose a different sound for every button, whereas inherit range copies a single sound over all of the buttons in the chunk, but with a different offset. This can be used to create a chromatic scale, or for slicing a sample.

## Create a simple oscillator synth chunk

Click the `New` button next to the 'Chunks' heading in the sidebar.

Choose 'Inherit Range' from the drop down, then select 'Trigger', and add an oscillator. There is a box labeled 'No Scale'. Use this to choose the desired musical scale (lets go for major today). You can also change the oscillator shape.

Now drag this new chunk (from the sidebar), to a controller in the setup pane. You should now be able to trigger the sounds. 

## Create a drum kit from your own drum samples

Click the `New` button next to the 'Chunks' heading in the sidebar. Leave the drop down as 'Range'.

Choose the desired amount of rows and columns (1 row, 4 cols).

Now go through each slot (1-4), and click the `+ sample` button. You can either drag in a file from your hard drive, or click the 'Choose File' button and browse for the desired drum samples.

You can add a global effect (such as overdrive) that applies to the overall sound of that chunk using the 'Output' slot.
