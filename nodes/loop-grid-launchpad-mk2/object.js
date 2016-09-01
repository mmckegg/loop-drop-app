var LoopGrid = require('../loop-grid/object')
var Looper = require('../loop-grid/looper')
var computeTargets = require('../loop-grid/compute-targets')
var computeFlags = require('../loop-grid/compute-flags')
var holdActive = require('lib/hold-active-transform')
var computeActiveIndexes = require('lib/active-indexes')

var Selector = require('../loop-grid/selector')
var Holder = require('../loop-grid/holder')
var Mover = require('../loop-grid/mover')
var Repeater = require('../loop-grid/repeater')
var Suppressor = require('../loop-grid/suppressor')

var ObservVarhash = require('observ-varhash')
var ObservStruct = require('@mmckegg/mutant/struct')
var ObservMidi = require('observ-midi')
var ObservGridStack = require('observ-grid-stack')
var GrabGrid = require('lib/grab-grid')
var MidiPort = require('lib/midi-port')
var MidiButtons = require('observ-midi/light-stack')
var watchButtons = require('lib/watch-buttons')

var Observ = require('@mmckegg/mutant/value')
var ArrayGrid = require('array-grid')

var DittyGridStream = require('lib/ditty-grid-stream')

var computed = require('@mmckegg/mutant/computed')
var watch = require('@mmckegg/mutant/watch')
var mapWatchDiff = require('lib/map-watch-diff-stack')
var mapGridValue = require('observ-grid/map-values')
var computeIndexesWhereContains = require('observ-grid/indexes-where-contains')

var ChunkColors = require('./chunk-colors')
var applyColorFilter = require('./apply-color-filter')
var getPortSiblings = require('lib/get-port-siblings')

var setLights = require('./set-lights.js')

var repeatStates = [2, 1, 2/3, 1/2, 1/3, 1/4, 1/6, 1/8]
var turnOffAll = [240, 0, 32, 41, 2, 24, 14, 0, 247]

var stateLights = {
  green: 33,
  greenLow: 35,
  red: 120,
  yellow: 63,
  redLow: 7,
  grey: 117,
  purpleLow: 55,
  brown: 11
}


module.exports = function(context){
  var loopGrid = LoopGrid(context)
  var looper = Looper(loopGrid)

  var scheduler = context.scheduler
  var gridMapping = getLaunchpadGridMapping()
  loopGrid.shape.set(gridMapping.shape)

  var activatedAt = 0
  var shiftHeld = false

  var midiPort = MidiPort(context, function (port, lastPort) {
    // turn off on switch
    lastPort && lastPort.write(turnOffAll)
    if (port) {
      port.write(turnOffAll)
      activatedAt = Date.now()
    }
  })

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

  obs.activeInput = computed([midiPort.stream], function (value) {
    return !!value
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
  obs.grabInput = function () {
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

  var chunkColors = ChunkColors(context.chunkLookup, context.setup.selectedChunkId, loopGrid.targets, loopGrid.shape)

  var outputLayers = ObservGridStack([

    chunkColors,

    // recording
    mapGridValue(looper.recording, 7),

    // active
    applyColorFilter(chunkColors, {
      multiply: 8,
      saturate: 1.5,
      active: loopGrid.active
    }),

    // selected
    mapGridValue(transforms.selector, 12),

    // suppressing
    mapGridValue(transforms.suppressor, 7),

    // playing
    applyColorFilter(chunkColors, {
      multiply: 8,
      add: 10,
      active: loopGrid.playing
    })

  ])

  setLights(outputLayers, midiPort.stream)

  var controllerGrid = ObservMidi(midiPort.stream, gridMapping)
  var inputGrabber = GrabGrid(controllerGrid)

  var noRepeat = computeIndexesWhereContains(flags, 'noRepeat')
  var freezeSuppress = computeIndexesWhereContains(flags, 'freezeSuppress')

  var grabInputExcludeNoRepeat = function (listener) {
    return inputGrabber(listener, { exclude: noRepeat })
  }

  var inputGrid = Observ()
  watch(inputGrabber, inputGrid.set)
  var activeIndexes = computeActiveIndexes(inputGrid)

  // trigger notes at bottom of input stack
  var output = DittyGridStream(inputGrid, loopGrid.grid, context.scheduler)
  output.on('data', loopGrid.triggerEvent)

  obs.currentlyPressed = computed([controllerGrid, loopGrid.grid], function (value, grid) {
    return grid.data.filter(function (name, index) {
      if (value.data[index]) {
        return true
      }
    })
  })

  // midi button mapping
  var buttons = MidiButtons(midiPort.stream, {
    store: '176/104',
    flatten: '176/105',
    undo: '176/106',
    redo: '176/107',
    hold: '176/108',
    suppress: '176/109',
    swapTarget: '176/110',
    select: '176/111'
  })

  var releaseLoopLengthLights = []

  watchButtons(buttons, {

    store: function(value){
      if (value){
        this.flash(stateLights.green)
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
          this.flash(stateLights.green, 100)
        } else {
          this.flash(stateLights.red, 100)
          transforms.suppressor.start(scheduler.getCurrentPosition(), transforms.selector.selectedIndexes())
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
          this.flash(stateLights.green, 100)
        } else {
          looper.undo()
          this.flash(stateLights.red, 100)
          buttons.store.flash(stateLights.red)
        }
      }
    },

    redo: function(value){
      if (value){
        if (shiftHeld){ // double loopLength
          var current = obs.loopLength() || 1
          obs.loopLength.set(current*2)
          this.flash(stateLights.green, 100)
        } else {
          looper.redo()
          this.flash(stateLights.red, 100)
          buttons.store.flash(stateLights.red)
        }
      }
    },

    hold: function(value){
      if (value){
        var turnOffLight = this.light(stateLights.purpleLow)
        transforms.holder.start(
          scheduler.getCurrentPosition(),
          transforms.selector.selectedIndexes(),
          turnOffLight
        )
      } else {
        transforms.holder.stop()
      }
    },

    suppress: function (value) {
      if (value) {
        var turnOffLight = this.light(stateLights.red)
        transforms.suppressor.start(scheduler.getCurrentPosition(), transforms.selector.selectedIndexes(), freezeSuppress(), turnOffLight)
      } else {
        transforms.suppressor.stop()
      }
    },

    swapTarget: function (value) {
      if (value) {
        getPortSiblings(obs, context.setup.controllers)[1].grabInput()
      } else if (Date.now() - activatedAt > 500) {
        getPortSiblings(obs, context.setup.controllers)[0].grabInput()
      }
    },

    select: function (value) {
      if (value) {
        var turnOffLight = this.light(stateLights.green)
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
        buttons.undo.light(stateLights.greenLow),
        buttons.redo.light(stateLights.greenLow)
      )

    } else {
      shiftHeld = false

      // turn off loop length lights
      while (releaseLoopLengthLights.length){
        releaseLoopLengthLights.pop()()
      }
    }
  })

  // light up undo buttons by default
  buttons.undo.light(stateLights.redLow)
  buttons.redo.light(stateLights.redLow)

  buttons.store.light(stateLights.grey)


  var willFlatten = computed([activeIndexes, looper.transforms], function (indexes, transforms) {
    return !!indexes.length || !!transforms.length
  })

  // light up store button when transforming (flatten mode)
  var releaseFlattenLight = null
  watch(willFlatten, function(value){
    if (value && !releaseFlattenLight){
      releaseFlattenLight = buttons.flatten.light(stateLights.greenLow)
    } else if (!value && releaseFlattenLight){
      releaseFlattenLight()
      releaseFlattenLight = null
    }
  })


  var repeatButtons = MidiButtons(midiPort.stream, {
    0: '144/89',
    1: '144/79',
    2: '144/69',
    3: '144/59',
    4: '144/49',
    5: '144/39',
    6: '144/29',
    7: '144/19'
  })

  // repeater
  var releaseRepeatLight = null
  mapWatchDiff(repeatStates, repeatButtons, obs.repeatLength.set)
  watch(obs.repeatLength, function (value) {
    var button = repeatButtons[repeatStates.indexOf(value)]
    if (button) {
      if (releaseRepeatLight) releaseRepeatLight()
      releaseRepeatLight = button.light(shiftHeld ? stateLights.red : stateLights.grey)
    }
    transforms.holder.setLength(value)
    if (value < 2) {
      transforms.repeater.start(grabInputExcludeNoRepeat, value, shiftHeld)
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
        releaseBeatLight = button.light(stateLights.greenLow, 0)
      }
      currentBeatLight = index
    }

    if (beat != currentBeat){
      button.flash(stateLights.green)
      currentBeat = beat
    }
  })

  // cleanup / disconnect from keyboard on destroy

  obs.destroy = function () {
    midiPort.destroy()
    output.destroy()
    loopGrid.destroy()
  }

  return obs
}

function round(value, dp){
  var pow = Math.pow(10, dp || 0)
  return Math.round(value * pow) / pow
}

function getLaunchpadGridMapping(){
  var result = []
  for (var r=0;r<8;r++){
    for (var c=0;c<8;c++){
      var noteId = ((8-r)*10)+(c+1)
      result.push('144/' + noteId)
    }
  }
  return ArrayGrid(result, [8, 8])
}
