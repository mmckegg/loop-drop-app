var Observ = require('observ')
var MidiPort = require('lib/midi-port')
var ObservMidi = require('observ-midi')
var ObservStruct = require('observ-struct')
var deepEqual = require('deep-equal')

var QueryParam = require('lib/query-param')
var ArrayStack = require('lib/array-stack')
var FlashArray = require('lib/flash-array')
var LightStack = require('observ-midi/light-stack')

var watch = require('observ/watch')
var computed = require('observ/computed')
var watchKnobs = require('lib/watch-knobs')
var scaleInterpolate = require('lib/scale-interpolate')

var turnOffAll = [176 + 8, 0, 0]
var mappings = {
  sendSelect: ['184/104', '184/105'],
  trackSelect: ['184/106', '184/107'],
  row1: ['184/13', '184/14', '184/15', '184/16', '184/17', '184/18', '184/19', '184/20'],
  row2: ['184/29', '184/30', '184/31', '184/32', '184/33', '184/34', '184/35', '184/36'],
  row3: ['184/49', '184/50', '184/51', '184/52', '184/53', '184/54', '184/55', '184/56'],
  sliders: ['184/77', '184/78', '184/79', '184/80', '184/81', '184/82', '184/83', '184/84'],
  trackFocus: ['152/41', '152/42', '152/43', '152/44', '152/57', '152/58', '152/59', '152/60'],
  trackControl: ['152/73', '152/74', '152/75', '152/76', '152/89', '152/90', '152/91', '152/92'],
  device: '152/105',
  mute: '152/106',
  solo: '152/107',
  record: '152/108'
}

module.exports = function (context) {
  var midiPort = MidiPort(context, function (port, lastPort) {
    // turn off on switch
    lastPort && lastPort.write(turnOffAll)
    port && port.write(turnOffAll)
  })

  var obs = ObservStruct({
    port: midiPort
  })

  // grab the midi for the current port
  obs.grabInput = function () {
    midiPort.grab()
  }

  obs.context = context

  var setup = context.setup
  var chunkIds = ChunkIds(setup.chunks)

  var paramState = []
  watchKnobs(midiPort.stream, mappings.row1.concat(mappings.row2, mappings.row3), function (id, data) {
    var index = Math.floor(id / 8)
    var chunk = setup.chunks.lookup.get(chunkIds()[id % 8])
    if (chunk) {
      var params = chunk.params || chunk.node && chunk.node.params
      if (params) {
        var paramId = params()[index]
        if (chunk.paramValues) {
          var currentValue = getValue(chunk.paramValues()[paramId])
          var newValue = scaleInterpolate(currentValue * 128, data, paramState[id] = paramState[id] || {}) / 128
          chunk.paramValues.put(paramId, setValue(currentValue, newValue))
        } else {
          var param = QueryParam(chunk, ['paramValues[?]', paramId])
          var currentValue = getValue(param.read())
          var newValue = scaleInterpolate(currentValue * 128, data, paramState[id] = paramState[id] || {}) / 128
          param.set(setValue(param.read(), setValue(param.read(), newValue)))
        }
      }
    }
  })

  var sliderState = []
  watchKnobs(midiPort.stream, mappings.sliders, function (id, data) {
    var chunk = setup.chunks.lookup.get(chunkIds()[id])
    if (chunk) {
      var volume = chunk.overrideVolume || chunk.node && chunk.node.overrideVolume
      if (volume) {
        var currentPosition = Math.pow(volume(), 1 / Math.E) * 108
        var newPosition = scaleInterpolate(currentPosition, data, sliderState[id] = sliderState[id] || {})
        volume.set(Math.pow(newPosition / 108, Math.E))
      }
    }
  }, 108)

  var buttonBase = computed([setup.selectedChunkId, chunkIds], function (selected, chunkIds) {
    var result = []
    for (var i = 0; i < 8; i++) {
      var chunkId = chunkIds[i]
      if (chunkId) {
        if (chunkId === selected) {
          result.push(light(2, 3))
        } else {
          result.push(light(1, 0))
        }
      } else {
        result.push(0)
      }
    }
    return result
  })

  var buttonFlash = FlashArray()
  setup.onTrigger(function (event) {
    if (event.id) {
      var chunkId = event.id.split('/')[0]
      var index = chunkIds().indexOf(chunkId)
      if (event.event === 'start') {
        if (chunkId === setup.selectedChunkId()) {
          buttonFlash.flash(index, light(3, 3), 40)
        } else {
          buttonFlash.flash(index, light(3, 0), 40)
        }
      }
    }
  })

  var buttons = ObservMidi(midiPort.stream, mappings.trackFocus, ArrayStack([
    buttonBase,
    buttonFlash
  ]))

  buttons(function (values) {
    var result = null

    values.forEach(function (val, i) {
      if (val) {
        result = i
      }
    })

    if (result != null) {
      var id = chunkIds()[result]
      if (id) {
        setup.selectedChunkId.set(id)
      }
    }
  })

  // CONTROL BUTTONS:
  var controlButtons = LightStack(midiPort.stream, {
    mode: mappings.device
  })

  controlButtons.mode(function (value) {
    if (value) {
      context.project.globalControllers.forEach(function (controller) {
        if (controller.port && controller.port() === obs.port() && controller.grabInput) {
          controller.grabInput()
          controller.port.override.set(true)
        }
      })
    }
  })

  obs.destroy = function () {
    midiPort.destroy()
  }

  return obs
}

function ChunkIds (chunks) {
  var chunkIds = Observ([])
  var refreshing = false

  watch(chunks.resolved, function (chunks) {
    if (!refreshing) {
      refreshing = true
      setImmediate(refresh)
    }
  })

  return chunkIds

  function refresh () {
    refreshing = false
    var value = chunks.resolved().reduce(function (result, chunk) {
      if (chunk && chunk.id && chunk.node !== 'modulatorChunk') {
        result.push(chunk.id)
      }
      return result
    }, [])
    if (!deepEqual(value, chunkIds())) {
      chunkIds.set(value)
    }
  }
}

function light(r, g, flag){
  if (!r || r < 0)  r = 0
  if (r > 3)        r = 3
  if (!g || g < 0)  g = 0
  if (g > 3)        g = 3
  if (flag == 'flash') {
    flag = 8
  } else if (flag == 'buffer') {
    flag = 0
  } else {
    flag = 12
  }

  return ((16 * g) + r) + flag
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
