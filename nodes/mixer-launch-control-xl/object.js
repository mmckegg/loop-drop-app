var Param = require('lib/param')
var MidiPort = require('lib/midi-port')
var ObservMidi = require('observ-midi')
var ObservStruct = require('mutant/struct')
var MutantMap = require('mutant/map')
var Property = require('lib/property')

var ArrayStack = require('lib/array-stack')
var FlashArray = require('lib/flash-array')
var LightStack = require('observ-midi/light-stack')

var watch = require('mutant/watch')
var computed = require('mutant/computed')
var watchKnobs = require('lib/watch-knobs')
var scaleInterpolate = require('lib/scale-interpolate')
var setLights = require('./set-lights')

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
    port: midiPort,
    chunkIds: Property([])
  })

  var releases = []
  var params = []
  for (var i = 0; i < 8; i++) {
    params[i] = [
      Param(context, 0),
      Param(context, 0),
      Param(context, 0)
    ]
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
      bindingReleases.set(item, item.overrideParams(params[index]))
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

  // grab the midi for the current port
  obs.grabInput = function () {
    midiPort.grab()
  }

  obs.context = context

  var setup = context.setup

  var paramState = []
  watchKnobs(midiPort.stream, mappings.row1.concat(mappings.row2, mappings.row3), function (id, data) {
    var param = params[id % 8][Math.floor(id / 8)]
    var chunk = setup.context.chunkLookup.get(obs.chunkIds()[id % 8])
    if (chunk && chunk.overrideParams && chunk.params) {
      param.set(scaleInterpolate(param() * 128, data, paramState[id] = paramState[id] || {}) / 128)
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

  var knobLights = computed([obs.chunkIds, setup.context.chunkLookup, pressed, setup.selectedChunkId], function (chunkIds, lookup, pressed, selected) {
    var result = []
    if (setup.context) {
      for (var i = 0; i < 8; i++) {
        var chunk = setup.context.chunkLookup.get(chunkIds[i])
        if (chunk && chunk.params) {
          var onValue = pressed.includes(chunkIds[i])
            ? light(0, 2)
            : selected === chunkIds[i]
              ? light(1, 1)
              : light(2, 0)
          result[0 + i] = chunk.params()[0] ? onValue : 0
          result[8 + i] = chunk.params()[1] ? onValue : 0
          result[16 + i] = chunk.params()[2] ? onValue : 0
        } else {
          result[0 + i] = result[8 + i] = result[16 + i] = 0
        }
      }
    }
    return result
  })

  setLights(knobLights, midiPort.stream)

  var buttonBase = computed([setup.selectedChunkId, obs.chunkIds, pressed], function (selected, chunkIds, pressed) {
    var result = []
    for (var i = 0; i < 8; i++) {
      var chunkId = chunkIds[i]
      if (chunkId) {
        if (chunkId === selected) {
          result.push(light(2, 3))
        } else if (pressed.includes(chunkId)) {
          result.push(light(0, 1))
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
      var index = obs.chunkIds().indexOf(chunkId)
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
      var id = obs.chunkIds()[result]
      if (id) {
        setup.selectedChunkId.set(id)
        setup.context.actions.scrollToSelectedChunk()
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
        if (controller && controller.port && controller.port() === obs.port() && controller.grabInput) {
          controller.grabInput()
          controller.port.override.set(true)
        }
      })
    }
  })

  obs.destroy = function () {
    while (releases.length) {
      releases.pop()()
    }
    for (var fn of bindingReleases.values()) {
      fn()
    }
    bindingReleases.clear()
    midiPort.destroy()
    params.forEach(items => items.forEach(param => param.destroy()))
  }

  return obs
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
  if (object instanceof Object && Object.keys(object).length) {
    var result = JSON.parse(JSON.stringify(object))
    while (result != null) {
      if (result.minValue != null) {
        if (result.minValue instanceof Object) {
          result = result.minValue
        } else {
          result.minValue = value
          break
        }
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

function resolveValue (value) {
  while (value instanceof Object) {
    if (value.minValue != null) {
      value = value.minValue
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
