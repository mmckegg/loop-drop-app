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
var getPortSiblings = require('lib/get-port-siblings')

var stateLights = require('./state-lights.js')
var repeatStates = [2, 1, 2/3, 1/2, 1/3, 1/4, 1/6, 1/8]


module.exports = function(context){

  var loopGrid = LoopGrid(context)
  var looper = Looper(loopGrid)

  var scheduler = context.scheduler
  var gridMapping = getLaunchpadGridMapping()
  loopGrid.shape.set(gridMapping.shape)

  var shiftHeld = false
  var activatedAt = 0

  var midiPort = MidiPort(context, function (port, lastPort) {
    // turn off on switch
    lastPort && lastPort.write([176, 0, 0])
    if (port) {
      port.write([176, 0, 0])
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

  var outputLayers = ObservGridStack([

    // recording
    mapGridValue(looper.recording, stateLights.redLow),

    // active
    mapGridValue(loopGrid.active, stateLights.greenLow),

    // flash selected chunk
    mapGridValue(Highlighting(loopGrid.grid, context.setup.selectedChunkId), stateLights.amberLow),

    // selected
    mapGridValue(transforms.selector, stateLights.green),

    // suppressing
    mapGridValue(transforms.suppressor, stateLights.red),

    // playing
    mapGridValue(loopGrid.playing, stateLights.amber)

  ])

  var controllerGrid = ObservMidi(midiPort.stream, gridMapping, outputLayers)
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
        var turnOffLight = this.light(stateLights.yellow)
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

    select: function(value){
      if (value){
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

  buttons.store.light(stateLights.amberLow)


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
    0: '144/8',
    1: '144/24',
    2: '144/40',
    3: '144/56',
    4: '144/72',
    5: '144/88',
    6: '144/104',
    7: '144/120'
  })

  // repeater
  var releaseRepeatLight = null
  mapWatchDiff(repeatStates, repeatButtons, obs.repeatLength.set)
  watch(obs.repeatLength, function (value) {
    var button = repeatButtons[repeatStates.indexOf(value)]
    if (button) {
      if (releaseRepeatLight) releaseRepeatLight()
      releaseRepeatLight = button.light(shiftHeld ? stateLights.red : stateLights.amberLow)
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
      var noteId = (r*16) + (c % 8)
      result.push('144/' + noteId)
    }
  }
  return ArrayGrid(result, [8, 8])
}

function Highlighting (grid, selected) {
  var highlighted = Observ()
  var timer = null

  highlighted.clear = function () {
    highlighted.set(null)
  }

  selected(function (id) {
    clearTimeout(timer)
    highlighted.set(id)
    timer = setTimeout(highlighted.clear, 400)
  })

  return computed([grid, highlighted], function (grid, highlighted) {
    return ArrayGrid(grid.data.map(function (val) {
      var id = getChunkId(val)
      if (id === highlighted) {
        return true
      }
    }), grid.shape)
  })
}

function getChunkId (id) {
  if (id && id.split) {
    return id.split('/')[0]
  }
}
