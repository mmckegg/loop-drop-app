var get = require('lodash.get')
var LoopGrid = require('../../nodes/loop-grid/object')
var Looper = require('../../nodes/loop-grid/looper')
var computedRecording = require('../../nodes/loop-grid/recording')
var computeTargets = require('../../nodes/loop-grid/compute-targets')
var computeFlags = require('../../nodes/loop-grid/compute-flags')
var holdActive = require('lib/hold-active-transform')
var computeActiveIndexes = require('lib/active-indexes')
var watchKnobs = require('lib/watch-knobs')
var Selector = require('../../nodes/loop-grid/selector')
var Holder = require('../../nodes/loop-grid/holder')
var Mover = require('../../nodes/loop-grid/mover')
var Repeater = require('../../nodes/loop-grid/repeater')
var Suppressor = require('../../nodes/loop-grid/suppressor')
var ParamLooper = require('lib/param-looper')
var Param = require('lib/param')
var Value = require('mutant/value')
var Dict = require('mutant/dict')
var MutantMap = require('mutant/map')
var ObservStruct = require('mutant/struct')
var Observ = require('mutant/value')
var ObservMidi = require('observ-midi')
var ObservGridStack = require('observ-grid-stack')
var GrabGrid = require('lib/grab-grid')
var MidiPort = require('lib/midi-port')
var MidiButton = require('observ-midi/value')
var MidiButtons = require('observ-midi/struct')
var watchButtons = require('lib/watch-buttons')
var scaleInterpolate = require('lib/scale-interpolate')
var Observ = require('mutant/value')
var ArrayGrid = require('array-grid')
var Property = require('lib/property')
var DittyGridStream = require('lib/ditty-grid-stream')

var computed = require('mutant/computed')
var watch = require('mutant/watch')
var mapWatchDiff = require('lib/map-watch-diff-stack')
var mapGridValue = require('observ-grid/map-values')
var computeIndexesWhereContains = require('observ-grid/indexes-where-contains')
var MidiParam = require('lib/midi-to-param')
var getPortSiblings = require('lib/get-port-siblings')
var rangeMatch = /(\d+)\/\[(\d+)-(\d+)\]/
var turnOffAll = [240, 0, 32, 41, 2, 24, 14, 0, 247]
var repeatStates = [2, 1, 2/3, 1/2, 1/3, 1/4, 1/6, 1/8]
module.exports = function (config) {
  return setup.bind(null, config)
}


function setup (config, context) {
  var loopGrid = LoopGrid(context)
  var looper = Looper(loopGrid)
  var recording = computedRecording(loopGrid)
  var project = context.project
  var scheduler = context.scheduler
  if (config.grid) {
    var gridMapping = getKeyboadGridMapping(config)
    var buttonMapping = getKeyboardButtons(config)
    loopGrid.shape.set(gridMapping.shape)
  }
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
    chunkIds: Property([])
  })

  obs.hasMixer = Observ(config.mixer ? 1:0)
  obs.hasGrid = Observ(config.grid ? 1:0)
  obs.activeInput = computed([midiPort.stream], function (value) {
    return !!value
  })
  // grab the midi for the current port
  obs.grabInput = function () {
    midiPort.grab()
  }

  obs.loopLength = loopGrid.loopLength
  obs.chunkPositions = Dict({})
  obs.gridState = ObservStruct({
    active: loopGrid.active,
    playing: loopGrid.playing,
    recording: recording,
    triggers: loopGrid.grid
  })
  var releaseLooper = watch(looper, loopGrid.loops.set)

  obs.context = context
  obs.playback = loopGrid
  obs.looper = looper
  obs.repeatLength = Observ(2)

  var flags = computeFlags(context.chunkLookup, obs.chunkPositions, loopGrid.shape)


  if (config.grid) {

    watch( // compute targets from chunks
      computeTargets(context.chunkLookup, obs.chunkPositions, loopGrid.shape),
      loopGrid.targets.set
    )

    var transforms = {
      selector: Selector(gridMapping.shape, gridMapping.stride),
      holder: Holder(looper.transform),
      mover: Mover(looper.transform),
      repeater: Repeater(looper.transformTop),
      suppressor: Suppressor(looper.transform, gridMapping.shape, gridMapping.stride)
    }

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

    // store button mapping

    ObservMidi(midiPort.stream, buttonMapping.store)(value => {
      if (hasValue(value)) looper.store()
    })

    ObservMidi(midiPort.stream, buttonMapping.flatten)(value => {
      if (hasValue(value)) {
        var active = activeIndexes()
        if (looper.isTransforming() || active.length){
          looper.transform(holdActive, active)
          looper.flatten()
          transforms.selector.stop()
        } else {
          transforms.suppressor.start(scheduler.getCurrentPosition(), transforms.selector.selectedIndexes())
          looper.flatten()
          transforms.suppressor.stop()
          transforms.selector.stop()
        }
      }
    })

    ObservMidi(midiPort.stream, buttonMapping.undo)(value => {
      if (hasValue(value)) looper.undo()
    })

    ObservMidi(midiPort.stream, buttonMapping.redo)(value => {
      if (hasValue(value)) looper.redo()
    })

    ObservMidi(midiPort.stream, buttonMapping.hold)(value => {
      if (hasValue(value)) {
        transforms.holder.start(context.scheduler.getCurrentPosition())
      } else {
        transforms.holder.stop()
      }
    })


    ObservMidi(midiPort.stream, buttonMapping.suppress)(value => {
      if (hasValue(value)) {
        transforms.suppressor.start(scheduler.getCurrentPosition(), transforms.selector.selectedIndexes(), freezeSuppress())
      } else {
        transforms.suppressor.stop()
      }
    })

    ObservMidi(midiPort.stream, buttonMapping.swapTarget)(value => {
      if (hasValue(value)) {
        getPortSiblings(obs, context.setup.controllers)[1].grabInput()
      } else if (Date.now() - activatedAt > 500) {
        getPortSiblings(obs, context.setup.controllers)[0].grabInput()
      }
    })

    ObservMidi(midiPort.stream, buttonMapping.half)(value => {
      if (hasValue(value)) {
        var current = obs.loopLength() || 1
        obs.loopLength.set(current/2)
      }
    })
    ObservMidi(midiPort.stream, buttonMapping.double)(value => {
      if (hasValue(value)) {
        var current = obs.loopLength() || 1
        obs.loopLength.set(current*2)
      }
    })
  }
  if (config.grid) {
    config.grid.forEach(row => {
      var repeatButtons = MidiButtons(midiPort.stream, {
        0: get(row, 'repeat.none', '0/0'),
        1: get(row, 'repeat["1"]', '0/0'),
        2: get(row, 'repeat["2/3"]', '0/0'),
        3: get(row, 'repeat["1/2"]', '0/0'),
        4: get(row, 'repeat["1/3"]', '0/0'),
        5: get(row, 'repeat["1/4"]', '0/0'),
        6: get(row, 'repeat["1/6"]', '0/0'),
        7: get(row, 'repeat["1/8"]', '0/0')
      })
      mapWatchDiff(repeatStates, repeatButtons, obs.repeatLength.set)
      watch(obs.repeatLength, function (value) {
        transforms.holder.setLength(value)
        if (value < 2 || shiftHeld) {
          transforms.repeater.start(grabInputExcludeNoRepeat, value, shiftHeld)
        } else {
          transforms.repeater.stop()
        }
      })
    })
  }


  if (config.mixer) {
    // start of mixer
    var releases = []
    var params = []
    var paramLoopers = []

    var recordingIndexes = Dict()
    var playingIndexes = Dict()
    var recordStarts = {}

    for (var i = 0; i < 8; i++) {
      params[i] = [
        Value(0),
        Value(0),
        Value(0),
        Value(0),
        Value(0),
        Value(0),
        Value(0),
        Value(0)
      ]

      paramLoopers[i] = [
        ParamLooper(context, params[i][0]),
        ParamLooper(context, params[i][1]),
        ParamLooper(context, params[i][2]),
        ParamLooper(context, params[i][3]),
        ParamLooper(context, params[i][4]),
        ParamLooper(context, params[i][5]),
        ParamLooper(context, params[i][6]),
        ParamLooper(context, params[i][7]),
      ]

      recordingIndexes.put(i, computed(paramLoopers[i].map(x => x.recording), (...args) => args.some(Boolean)))
      playingIndexes.put(i, computed(paramLoopers[i].map(x => x.playing), (...args) => args.some(Boolean)))
    }

    var bindingReleases = new Map()
    var bindings = MutantMap(obs.chunkIds, (id, invalidateOn) => {
      var item = context.chunkLookup.get(id)
      var index = obs.chunkIds().indexOf(id)
      invalidateOn(computed([context.chunkLookup, obs.chunkIds], (_, chunkIds) => {
        // rebind when chunk is changed
        return item !== context.chunkLookup.get(id) || chunkIds.indexOf(id) !== index
      }))
      if (item) {
        bindingReleases.set(item, item.overrideParams(paramLoopers[index]))
      }
      return item
    }, {
      onRemove: function (item) {
        if (bindingReleases.has(item)) {
          bindingReleases.get(item)()
          bindingReleases.delete(item)
        }
      }
    })

    releases.push(watch(bindings))
    var setup = context.setup

    // transpose the knobs from rows into columns
    var mappings = { knobs: [], sliders: [], trackControl: [] }
    for (var i=0; i<8; i++) {
      var knobRow = []
      for (var j=0; j<8; j++) {
        var knob = get(config, `mixer.channels[${j}].params[${i}]`, '0/0')
        mappings.knobs.push(knob)
      }
      var slider = get(config, `mixer.channels[${i}].volume`, '0/0')
      mappings.sliders.push(slider)
      var store = get(config, `mixer.channels[${i}].store`, '0/0')
      mappings.trackControl.push(store)
    }

    watchKnobs(midiPort.stream, mappings.knobs, function (id, data) {
      var param = params[id % 8][Math.floor(id / 8)]
      var chunk = setup.context.chunkLookup.get(obs.chunkIds()[id % 8])
      if (chunk && chunk.overrideParams && chunk.params) {
        param.set(data / 127)
      }
    })

    var sliderState = []

    watchKnobs(midiPort.stream, mappings.sliders, function (id, data) {
      var chunk = setup.context.chunkLookup.get(obs.chunkIds()[id])
      if (chunk && chunk.overrideVolume) {
        var currentPosition = Math.pow(chunk.overrideVolume(), 1 / Math.E) * 108
        var newPosition = scaleInterpolate(currentPosition, data, sliderState[id] = sliderState[id] || {})
        chunk.overrideVolume.set(Math.pow(newPosition / 108, Math.E))
      }
    }, 108)

    var pressed = computed(MutantMap(setup.controllers, function (controller) {
      return controller && controller.currentlyPressed
    }), function (items) {
      return items.reduce(function (result, pressed) {
        if (pressed) {
          pressed.map(x => x && x.split('/')[0]).reduce(addIfUnique, result)
        }
        return result
      }, [])
    })
    var recordButtonBase = computed([recordingIndexes, playingIndexes], function (recordingIndexes, playingIndexes) {
      var result = []
      for (var i = 0; i < 8; i++) {
        if (recordingIndexes[i]) {
          // result[i] = light(3, 0)
        } else if (playingIndexes[i]) {
          // result[i] = light(0, 3)
        } else {
          // result[i] = 0
        }
      }
      return result
    })

    var recordButtons = ObservMidi(midiPort.stream, mappings.trackControl, recordButtonBase)
    recordButtons(function (values) {
      values.forEach(function (val, i) {
        paramLoopers[i].forEach(looper => looper.recording.set(!!val))

        if (val) {
          recordStarts[i] = Date.now()
        } else if (Date.now() - recordStarts[i] < 200) {
          paramLoopers[i].forEach(looper => looper.set(0))
        }
      })
    })


  }
  // end of mixer

  // cleanup / disconnect from keyboard on destroy
  obs.destroy = function () {
    recording.destroy()
    midiPort.destroy()
    output.destroy()
    loopGrid.destroy()
    releaseLooper()
    while (releases.length) {
      releases.pop()()
    }
    for (var fn of bindingReleases.values()) {
      fn()
    }
    bindingReleases.clear()
    paramLoopers.forEach(items => items.forEach(param => param.destroy()))
  }

  return obs
}

function round(value, dp){
  var pow = Math.pow(10, dp || 0)
  return Math.round(value * pow) / pow
}


function getKeyboadGridMapping(config) {
  if (!config.grid) return null
  var notes = []
  var height = 0
  var width
  config.grid.forEach(function (row) {
    height++
    width = 0
    var parts = row.keys.match(rangeMatch)
    var channel = parts[1]
    for (var note = Number(parts[2]); note <= Number(parts[3]); note++) {
      notes.push(String(channel) + '/' + String(note))
      width++
    }
  })
  return ArrayGrid(notes, [height,width])
}

function getKeyboardButtons (config) {
  var buttons = {
    store: [],
    flatten: [],
    undo: [],
    redo: [],
    hold: [],
    suppress: [],
    swapTarget: [],
    half: [],
    double: []
  }
  if (!config.grid) return buttons
  config.grid.forEach(function (row) {
    if (!row.buttons) return
    if (row.buttons.store) buttons.store.push(row.buttons.store)
    if (row.buttons.flatten) buttons.flatten.push(row.buttons.flatten)
    if (row.buttons.undo) buttons.undo.push(row.buttons.undo)
    if (row.buttons.redo) buttons.redo.push(row.buttons.redo)
    if (row.buttons.hold) buttons.hold.push(row.buttons.hold)
    if (row.buttons.suppress) buttons.suppress.push(row.buttons.suppress)
    if (row.buttons.swapTarget) buttons.swapTarget.push(row.buttons.swapTarget)
    if (row.buttons.half) buttons.half.push(row.buttons.half)
    if (row.buttons.double) buttons.double.push(row.buttons.double)
  })
  return buttons
}

function hasValue(value) {
  if (value instanceof Array) {
    for (var i=0; i<value.length;i++) {
      if (value[i]) return true
    }
    return false
  }
  else return value
}


function setValue (object, value) {
  if (object instanceof Object) {
    var result = JSON.parse(JSON.stringify(object))
    while (result != null) {
      if (result.maxValue != null) {
        result.maxValue = value
        break
      } else if (result.value instanceof Object) {
        result = result.value
      } else {
        result.value = value
        break
      }
    }
    return result
  } else {
    return value
  }
}


function isSetup (item) {
  return item && item.node && item.node._type === 'LoopDropSetup'
}

function getValue (value) {
  while (value instanceof Object) {
    if (value.maxValue != null) {
      value = value.maxValue
    } else {
      value = value.value
    }
  }
  return value
}

function addIfUnique (result, item) {
  if (!result.includes(item)) {
    result.push(item)
  }
  return result
}
