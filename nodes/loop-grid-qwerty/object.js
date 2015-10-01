var LoopGrid = require('loop-grid')
var Looper = require('loop-grid/looper')
var Holder = require('loop-grid/transforms/holder')
var Repeater = require('loop-grid/transforms/repeater')
var Suppressor = require('loop-grid/transforms/suppressor')
var holdActive = require('lib/hold-active-transform')

var ArrayGrid = require('array-grid')
var Observ = require('observ')
var ObservVarhash = require('observ-varhash')
var ObservStruct = require('observ-struct')
var ObservGrid = require('observ-grid')
var GrabGrid = require('lib/grab-grid')
var ObservKeys = require('lib/observ-keys.js')

var computeTargets = require('loop-grid/compute-targets')
var computeFlags = require('loop-grid/compute-flags')
var computeIndexesWhereContains = require('observ-grid/indexes-where-contains')
var computeActiveIndexes = require('lib/active-indexes')

var watch = require('observ/watch')
var watchStruct = require('lib/watch-struct')
var setMappedValue = require('lib/set-mapped-value')

var DittyGridStream = require('lib/ditty-grid-stream')
var convertKeyCode = require('keycode')

var InputStack = require('./input-stack.js')
var repeatStates = [2, 1, 2/3, 1/2, 1/3, 1/4, 1/6, 1/8, 3/4, 0]

module.exports = LoopQwerty

var versionKey = 2
var cacheKey = "__QWERTY_KEY_INPUT_CACHE@" + versionKey
var getInput = document[cacheKey] = document[cacheKey] || InputStack()
var repeatLength = Observ(2)

function LoopQwerty (context) {
  
  var loopGrid = LoopGrid(context)
  var looper = Looper(loopGrid)

  var gridMapping = getGridMapping()
  loopGrid.shape.set(gridMapping.shape)

  var obs = ObservStruct({
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

  var flags = computeFlags(context.chunkLookup, obs.chunkPositions, loopGrid.shape)

  watch( // compute targets from chunks
    computeTargets(context.chunkLookup, obs.chunkPositions, loopGrid.shape),
    loopGrid.targets.set
  )

  // bind to qwerty keyboard
  var keysDown = getInput()
  var controllerGrid = KeyboardGrid(keysDown, gridMapping)
  var inputGrabber = GrabGrid(controllerGrid)

  // grab the midi for the current port
  obs.grabInput = function(){
    keysDown.grab()
  }

  obs.activeInput = keysDown.active

  //HACK: all inputs share repeatLength
  obs.repeatLength = repeatLength

  var inputGrid = Observ()
  watch(inputGrabber, inputGrid.set)
  var activeIndexes = computeActiveIndexes(inputGrid)

  var output = DittyGridStream(inputGrid, loopGrid.grid, context.scheduler)
  output.on('data', loopGrid.triggerEvent)

  var noRepeat = computeIndexesWhereContains(flags, 'noRepeat')
  var grabInputExcludeNoRepeat = function (listener) {
    return inputGrabber(listener, { exclude: noRepeat })
  }

  // loop transforms
  var transforms = {
    holder: Holder(looper.transform),
    repeater: Repeater(looper.transform),
    suppressor: Suppressor(looper.transform, gridMapping.shape, gridMapping.stride)
  }

  var buttons = ObservKeys(keysDown, {
    store: 'space',
    flatten: 'backspace',
    undo: '-',
    redo: '=',
    hold: 'shift',
    halve: '[',
    double: ']'
  })

  watchStruct(buttons, {

    store: function(value){
      if (value){
        looper.store()
      }
    },
  
    flatten: function(value){
      if (value){
        var active = activeIndexes()
        if (looper.isTransforming()){
          looper.flatten()
        } else if (active.length) {
          looper.transform(holdActive, active)
          looper.flatten()
        } else {
          transforms.suppressor.start()
          looper.flatten()
          transforms.suppressor.stop()
        }
      }
    },
  
    undo: function(value){
      if (value){
        looper.undo()
      }
    },
  
    redo: function(value){
      if (value){
        looper.redo()
      }
    },
  
    hold: function(value){
      if (value){
        transforms.holder.start(context.scheduler.getCurrentPosition())
      } else {
        transforms.holder.stop()
      }
    },

    halve: function(value){
      if (value){
        var current = obs.loopLength() || 1
        obs.loopLength.set(current/2)
      }
    },

    double: function(value){
      if (value){
        var current = obs.loopLength() || 1
        obs.loopLength.set(current*2)
      }
    }

  })

  var repeatButtons = ObservKeys(keysDown, {
    0: '1', 1: '2', 2: '3', 3: '4', 4: '5',
    5: '6', 6: '7', 7: '8', 8: '9', 9: '0'
  })

  // repeater
  var releaseRepeatLight = null
  setMappedValue(repeatStates, repeatButtons, obs.repeatLength)
  watch(obs.repeatLength, function(value){
    transforms.holder.setLength(value)
    if (value < 2){
      transforms.repeater.start(grabInputExcludeNoRepeat, value)
    } else {
      transforms.repeater.stop()
    }
  })

  // cleanup / disconnect from keyboard on destroy

  obs.destroy = function(){
    keysDown.close()
    loopGrid.destroy()
  }

  return obs
}

function KeyboardGrid(obs, mapping){
  var result = ObservGrid([], mapping.shape)

  watch(obs, function(value){
    var codes = resolve(mapping).data
    var r = value.reduce(function(res, code){
      var index = codes.indexOf(code)
      if (~index) res[index] = true
      return res
    }, [])
    result.data.set(r)
  })

  return result
}

function getGridMapping(){
  var result = "qwertyuiopasdfghjkl;zxcvbnm,./".split('').map(convertKeyCode)
  return ArrayGrid(result, [3, 10])
}

function resolve(val){
  return typeof val === 'function' ? val() : val
}