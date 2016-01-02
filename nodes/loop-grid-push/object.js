// Ableton Push controller support
// Written by Fabio Neves - fzero.ca / nostep.ca / github.com/fzero

var LoopGrid = require('loop-grid')
var Looper = require('loop-grid/looper')
var computeTargets = require('loop-grid/compute-targets')
var computeFlags = require('loop-grid/compute-flags')
var holdActive = require('lib/hold-active-transform')
var computeActiveIndexes = require('lib/active-indexes')

var Selector = require('loop-grid/selector')
var Holder = require('loop-grid/transforms/holder')
var Mover = require('loop-grid/transforms/mover')
var Repeater = require('loop-grid/transforms/repeater')
var Suppressor = require('loop-grid/transforms/suppressor')

var ObservVarhash = require('observ-varhash')
var ObservStruct = require('observ-struct')
var ObservMidi = require('observ-midi')
var ObservGridStack = require('observ-grid-stack')
var GrabGrid = require('lib/grab-grid')
var MidiPort = require('lib/midi-port')
var MidiButtons = require('observ-midi/light-stack')
var watchButtons = require('lib/watch-buttons')

var Observ = require('observ')
var ArrayGrid = require('array-grid')

var DittyGridStream = require('lib/ditty-grid-stream')

var computed = require('observ/computed')

var watch = require('observ/watch')
var mapWatchDiff = require('lib/map-watch-diff-stack')
var mapGridValue = require('observ-grid/map-values')
var computeIndexesWhereContains = require('observ-grid/indexes-where-contains')

var pushColors = require('./push-colors.js')
var PushDisplay = require('./push-display.js')
var repeatStates = [2, 1, 2/3, 1/2, 1/3, 1/4, 1/6, 1/8]


module.exports = function(context){

  var loopGrid = LoopGrid(context)
  var looper = Looper(loopGrid)

  var scheduler = context.scheduler
  var gridMapping = getPushGridMapping()
  loopGrid.shape.set(gridMapping.shape)

  var shiftHeld = false

  // controller midi port
  var midiPort = MidiPort(context, function (stream, lastStream) {
    if (lastStream) turnOffAllLights(lastStream)
    if (stream) {
      turnOffAllLights(stream)
      initDisplay()
    }
  })

  // Push display
  var display = new PushDisplay(midiPort.stream)

  // extend loop-grid instance
  var obs = ObservStruct({
    port: midiPort,
    loopLength: loopGrid.loopLength,
    chunkPositions: ObservVarhash({})
  })

  obs.gridState = ObservStruct({
    active: loopGrid.active,
    playing: loopGrid.playing,
    recording: looper.recording,
    triggers: loopGrid.grid
  })

  watch(looper, loopGrid.loops.set)

  obs.context = context
  obs.playback = loopGrid
  obs.looper = looper
  obs.repeatLength = Observ(2)

  var flags = computeFlags(context.chunkLookup, obs.chunkPositions, loopGrid.shape)

  watch( // compute targets from chunks
    computeTargets(context.chunkLookup, obs.chunkPositions, loopGrid.shape),
    loopGrid.targets.set
  )

  // grab the midi for the current port
  obs.grabInput = function(){
    midiPort.grab()
  }

  // loop transforms
  var transforms = {
    selector: Selector(gridMapping.shape, gridMapping.stride),
    holder: Holder(looper.transform),
    mover: Mover(looper.transform),
    repeater: Repeater(looper.transformTop),
    suppressor: Suppressor(looper.transform, gridMapping.shape, gridMapping.stride)
  }

  var outputLayers = ObservGridStack([

    // recording
    mapGridValue(looper.recording, pushColors.pads.redLow),

    // active
    mapGridValue(loopGrid.active, pushColors.pads.greenLow),

    // selected
    mapGridValue(transforms.selector, pushColors.pads.blue),

    // suppressing
    mapGridValue(transforms.suppressor, pushColors.pads.red),

    // playing
    mapGridValue(loopGrid.playing, pushColors.pads.limeHi)

  ])

  var controllerGrid = ObservMidi(midiPort.stream, gridMapping, outputLayers)
  var inputGrabber = GrabGrid(controllerGrid)

  var noRepeat = computeIndexesWhereContains(flags, 'noRepeat')
  var grabInputExcludeNoRepeat = function (listener) {
    return inputGrabber(listener, { exclude: noRepeat })
  }

  var inputGrid = Observ()
  watch(inputGrabber, inputGrid.set)
  var activeIndexes = computeActiveIndexes(inputGrid)

  // trigger notes at bottom of input stack
  var output = DittyGridStream(inputGrid, loopGrid.grid, context.scheduler)
  output.on('data', loopGrid.triggerEvent)

  // midi command button mapping
  // On Push this is the row right above the pads
  var buttons = MidiButtons(midiPort.stream, {
    store: '176/102',
    flatten: '176/103',
    undo: '176/104',
    redo: '176/105',
    hold: '176/106',
    suppress: '176/107',
    snap2: '176/108',
    select: '176/109'
  })

  var releaseLoopLengthLights = []

  watchButtons(buttons, {

    store: function(value){
      if (value){
        this.flash(pushColors.pads.green)
        looper.store()
      }
    },

    flatten: function(value){
      if (value){
        var active = activeIndexes()
        if (looper.isTransforming() || active.length){
          looper.transform(holdActive, active)
          looper.flatten()
          transforms.selector.stop()
          this.flash(pushColors.pads.green, 100)
        } else {
          this.flash(pushColors.pads.red, 100)
          transforms.suppressor.start(transforms.selector.selectedIndexes())
          looper.flatten()
          transforms.suppressor.stop()
          transforms.selector.stop()
        }
      }
    },

    undo: function(value){
      if (value){
        if (shiftHeld){ // halve loopLength
          var current = obs.loopLength() || 1
          obs.loopLength.set(current/2)
          this.flash(pushColors.pads.green, 100)
        } else {
          looper.undo()
          this.flash(pushColors.pads.red, 100)
          buttons.store.flash(pushColors.pads.red)
        }
      }
    },

    redo: function(value){
      if (value){
        if (shiftHeld){ // double loopLength
          var current = obs.loopLength() || 1
          obs.loopLength.set(current*2)
          this.flash(pushColors.pads.green, 100)
        } else {
          looper.redo()
          this.flash(pushColors.pads.red, 100)
          buttons.store.flash(pushColors.pads.red)
        }
      }
    },

    hold: function(value){
      if (value){
        var turnOffLight = this.light(pushColors.pads.yellow)
        transforms.holder.start(
          scheduler.getCurrentPosition(),
          transforms.selector.selectedIndexes(),
          turnOffLight
        )
      } else {
        transforms.holder.stop()
      }
    },

    suppress: function(value){
      if (value){
        var turnOffLight = this.light(pushColors.pads.red)
        transforms.suppressor.start(transforms.selector.selectedIndexes(), turnOffLight)
      } else {
        transforms.suppressor.stop()
      }
    },

    select: function(value){
      if (value){
        var turnOffLight = this.light(pushColors.pads.green)
        transforms.selector.start(inputGrabber, function done(){
          transforms.mover.stop()
          transforms.selector.clear()
          turnOffLight()
        })
      } else {
        if (transforms.selector.selectedIndexes().length){
          transforms.mover.start(inputGrabber, transforms.selector.selectedIndexes())
        } else {
          transforms.selector.stop()
        }
      }
    }
  })

  // shift button (share select button)
  watch(buttons.select, function(value){
    if (value){
      shiftHeld = true

      // turn on loop length lights
      releaseLoopLengthLights.push(
        buttons.undo.light(pushColors.pads.pink),
        buttons.redo.light(pushColors.pads.pink)
      )

      // Update display
      display
      .setCell(3, 2, "Halve")
      .setCell(3, 3, "Double")
      .update();

    } else {
      shiftHeld = false

      // turn off loop length lights
      while (releaseLoopLengthLights.length){
        releaseLoopLengthLights.pop()()
      }

      // Update display
      display
      .setCell(3, 2, "Undo")
      .setCell(3, 3, "Redo")
      .update();
    }
  })

  // light up undo buttons by default
  buttons.undo.light(pushColors.pads.cyan)
  buttons.redo.light(pushColors.pads.cyan)

  buttons.store.light(pushColors.pads.amberLow)


  var willFlatten = computed([activeIndexes, looper.transforms], function (indexes, transforms) {
    return !!indexes.length || !!transforms.length
  })

  // light up store button when transforming (flatten mode)
  var releaseFlattenLight = null
  watch(willFlatten, function(value){
    if (value && !releaseFlattenLight){
      releaseFlattenLight = buttons.flatten.light(pushColors.pads.greenLow)
    } else if (!value && releaseFlattenLight){
      releaseFlattenLight()
      releaseFlattenLight = null
    }
  })

  // Push side buttons - labels don't match, left here for reference
  // var repeatButtons = MidiButtons(duplexPort, {
  //   0: '176/43',
  //   1: '176/42',
  //   2: '176/41',
  //   3: '176/40',
  //   4: '176/39',
  //   5: '176/38',
  //   6: '176/37',
  //   7: '176/36'
  // })

  // Push top row buttons
  var repeatButtons = MidiButtons(midiPort.stream, {
    0: '176/20',
    1: '176/21',
    2: '176/22',
    3: '176/23',
    4: '176/24',
    5: '176/25',
    6: '176/26',
    7: '176/27'
  })

  // repeater
  var releaseRepeatLight = null
  mapWatchDiff(repeatStates, repeatButtons, obs.repeatLength.set)
  watch(obs.repeatLength, function(value){
    var button = repeatButtons[repeatStates.indexOf(value)]
    if (button){
      if (releaseRepeatLight) releaseRepeatLight()
      releaseRepeatLight = button.light(pushColors.buttons.amberLow)
    }
    transforms.holder.setLength(value)
    if (value < 2){
      transforms.repeater.start(grabInputExcludeNoRepeat, value)
    } else {
      transforms.repeater.stop()
    }
  })


  // visual metronome / loop position
  var releaseBeatLight = null
  var currentBeatLight = null
  var currentBeat = null

  watch(loopGrid.loopPosition, function(value){
    var beat = Math.floor(value[0])
    var index = Math.floor(value[0] / value[1] * 8)
    var button = repeatButtons[index]

    if (index != currentBeatLight){
      if (button){
        releaseBeatLight&&releaseBeatLight()
        releaseBeatLight = button.light(pushColors.buttons.greenLow, 0)
      }
      currentBeatLight = index
    }

    if (beat != currentBeat){
      button.flash(pushColors.buttons.greenHi)
      currentBeat = beat
    }
  })

  // cleanup / disconnect from keyboard on destroy

  obs.destroy = function(){
    midiPort.destroy()
    display.init()
    output.destroy()
    loopGrid.destroy()
  }

  return obs

  // scoped

  function initDisplay() {
    // Clear screen
    display.init();

    // Top line
    display
    .setCell(0, 3, "    Loop")
    .setCell(0, 4, "Drop");

    // Repeats
    display
    .setCell(2, 0, "Trigger")
    .setCell(2, 1, "   1")
    .setCell(2, 2, "  2/3")
    .setCell(2, 3, "  1/2")
    .setCell(2, 4, "  1/3")
    .setCell(2, 5, "  1/4")
    .setCell(2, 6, "  1/6")
    .setCell(2, 7, "  1/8");

    // Buttons
    display
    .setCell(3, 0, "RecLoop")
    .setCell(3, 1, "Clr/Flat")
    .setCell(3, 2, "Undo")
    .setCell(3, 3, "Redo")
    .setCell(3, 4, "BeatHold")
    .setCell(3, 5, "Suppress")
    .setCell(3, 6, "SwapTrgt")
    .setCell(3, 7, "Select");

    display.update();
  }

  function turnOffAllLights (port) {
    var LOW_PAD = 36, // Bottom left
        HI_PAD = 99,  // Top Right
        LOW_REPEAT = 10,
        HI_REPEAT = 27,
        LOW_BUTTON = 102,
        HI_BUTTON = 109;

    // Clear notes
    for (var pad = LOW_PAD; pad <= HI_PAD; pad++) {
      port.write([128, pad, 0]);
    }

    // Clear repeat buttons
    for (var button = LOW_REPEAT; button <= HI_REPEAT; button++) {
      port.write([176, button, 0]);
    }

    // Clear buttons
    for (var button = LOW_BUTTON; button <= HI_BUTTON; button++) {
      port.write([176, button, 0]);
    }
  }
}

function round(value, dp){
  var pow = Math.pow(10, dp || 0)
  return Math.round(value * pow) / pow
}


function getPushGridMapping() {
  var LOW_PAD = 36, // Bottom left
      HI_PAD = 99,  // Top Right
      result = [];

  // Top down, left to right
  for (var row = 1; row <= 8; row++) {
    var row_start = (HI_PAD + 1) - row * 8;
    var row_end = row_start + 8;
    for (var noteId = row_start; noteId < row_end; noteId++) {
      result.push('144/' + noteId);
    }
  }
  return ArrayGrid(result, [8, 8]);
}
