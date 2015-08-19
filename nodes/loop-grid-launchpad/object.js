var LoopGrid = require('loop-grid')
var Looper = require('loop-grid/looper')
var computeTargets = require('loop-grid/compute-targets')
var computeFlags = require('loop-grid/compute-flags')

var Selector = require('loop-grid/selector')
var Holder = require('loop-grid/transforms/holder')
var Mover = require('loop-grid/transforms/mover')
var Repeater = require('loop-grid/transforms/repeater')
var Suppressor = require('loop-grid/transforms/suppressor')

var ObservVarhash = require('observ-varhash')
var ObservStruct = require('observ-struct')
var ObservMidi = require('observ-midi')
var ObservGridStack = require('observ-grid-stack')
var ObservGridGrabber = require('observ-grid/grabber')
var ObservMidiPort = require('midi-port-holder')
var MidiButtons = require('observ-midi/light-stack')
var watchButtons = require('lib/watch-buttons')

var Observ = require('observ')
var ArrayGrid = require('array-grid')

var DittyGridStream = require('lib/ditty-grid-stream')

var computedPortNames = require('midi-port-holder/computed-port-names')

var watch = require('observ/watch')
var mapWatchDiff = require('lib/map-watch-diff-stack')
var mapGridValue = require('observ-grid/map-values')
var computeIndexesWhereContains = require('observ-grid/indexes-where-contains')

var stateLights = require('./state-lights.js')
var repeatStates = [2, 1, 2/3, 1/2, 1/3, 1/4, 1/6, 1/8]


module.exports = function(context){

  var loopGrid = LoopGrid(context)
  var looper = Looper(loopGrid)

  var scheduler = context.scheduler
  var gridMapping = getLaunchpadGridMapping()
  loopGrid.shape.set(gridMapping.shape)

  var shiftHeld = false

  // controller midi port
  var portHolder = ObservMidiPort()
  var duplexPort = portHolder.stream
  
  duplexPort.on('switch', turnOffAllLights)
  duplexPort.on('switching', turnOffAllLights)

  // extend loop-grid instance
  var obs = ObservStruct({
    port: portHolder,
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
  obs.portChoices = computedPortNames()
  obs.repeatLength = Observ(2)
  
  var flags = computeFlags(context.chunkLookup, obs.chunkPositions, loopGrid.shape)

  watch( // compute targets from chunks
    computeTargets(context.chunkLookup, obs.chunkPositions, loopGrid.shape), 
    loopGrid.targets.set
  )

  // grab the midi for the current port
  obs.grabInput = function(){
    portHolder.grab()
  }

  // loop transforms
  var transforms = {
    selector: Selector(gridMapping.shape, gridMapping.stride),
    holder: Holder(looper.transform),
    mover: Mover(looper.transform),
    repeater: Repeater(looper.transform),
    suppressor: Suppressor(looper.transform, gridMapping.shape, gridMapping.stride)
  }

  var outputLayers = ObservGridStack([

    // recording
    mapGridValue(looper.recording, stateLights.redLow),

    // active
    mapGridValue(loopGrid.active, stateLights.greenLow),

    // selected
    mapGridValue(transforms.selector, stateLights.green),

    // suppressing
    mapGridValue(transforms.suppressor, stateLights.red),

    // playing
    mapGridValue(loopGrid.playing, stateLights.amber)

  ])

  var controllerGrid = ObservMidi(duplexPort, gridMapping, outputLayers)
  var inputGrabber = ObservGridGrabber(controllerGrid)

  var noRepeat = computeIndexesWhereContains(flags, 'noRepeat')
  var grabInputExcludeNoRepeat = inputGrabber.bind(this, {exclude: noRepeat})

  // trigger notes at bottom of input stack
  var output = DittyGridStream(inputGrabber, loopGrid.grid, context.scheduler)
  output.on('data', loopGrid.triggerEvent)

  // midi button mapping
  var buttons = MidiButtons(duplexPort, {
    store: '176/104',
    flatten: '176/105',
    undo: '176/106',
    redo: '176/107',
    hold: '176/108',
    suppress: '176/109',
    snap2: '176/110',
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
        if (looper.isTransforming()){
          looper.flatten()
          transforms.selector.stop()
          this.flash(stateLights.green, 100)
        } else {
          this.flash(stateLights.red, 100)
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

    suppress: function(value){
      if (value){
        var turnOffLight = this.light(stateLights.red)
        transforms.suppressor.start(transforms.selector.selectedIndexes(), turnOffLight)
      } else {
        transforms.suppressor.stop()
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


  // light up store button when transforming (flatten mode)
  var releaseFlattenLight = null
  watch(looper.transforms, function(values){
    if (values.length && !releaseFlattenLight){
      releaseFlattenLight = buttons.flatten.light(stateLights.greenLow)
    } else if (releaseFlattenLight){
      releaseFlattenLight()
      releaseFlattenLight = null
    }
  })


  var repeatButtons = MidiButtons(duplexPort, {
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
  watch(obs.repeatLength, function(value){
    var button = repeatButtons[repeatStates.indexOf(value)]
    if (button){
      if (releaseRepeatLight) releaseRepeatLight()
      releaseRepeatLight = button.light(stateLights.amberLow)
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

  obs.destroy = function(){
    turnOffAllLights()
    portHolder.destroy()
    output.destroy()
    loopGrid.destroy()
  }

  return obs

  // scoped

  function turnOffAllLights(){
    duplexPort.write([176, 0, 0])
  }

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