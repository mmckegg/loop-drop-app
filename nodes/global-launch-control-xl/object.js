var Observ = require('observ')
var MidiPort = require('lib/midi-port')
var ObservMidi = require('observ-midi')
var ObservStruct = require('observ-struct')
var ArrayStack = require('lib/array-stack')
var FlashArray = require('lib/flash-array')
var AnyTrigger = require('lib/on-trigger')
var LightStack = require('observ-midi/light-stack')
var MidiParam = require('lib/midi-to-param')

var computed = require('observ/computed')
var watchKnobs = require('lib/watch-knobs')
var scaleInterpolate = require('lib/scale-interpolate')
var findItemByPath = require('lib/find-item-by-path')

var turnOffAll = [176 + 8, 0, 0]
var setLed = [240, 0, 32, 41, 2, 17, 120, 8]
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
  var activatedAt = Date.now()
  var midiPort = MidiPort(context, function (port, lastPort) {
    // turn off on switch
    lastPort && lastPort.write(turnOffAll)

    if (port) {
      activatedAt = Date.now()
      port.write(turnOffAll)
      var values = []
      for (var i = 0; i < 8; i++) {
        if (i >= 2) {
          values.push(i, light(1, 1))
        } else {
          values.push(i, light(2, 2))
        }
        values.push(i + 8, light(1, 0))
        values.push(i + 16, light(0, 1))
      }
      port.write(setLed.concat(values, 247))
    }
  })

  var obs = ObservStruct({
    port: midiPort
  })

  // grab the midi for the current port
  obs.grabInput = function () {
    midiPort.grab()
  }

  obs.context = context

  var project = context.project
  var onTrigger = AnyTrigger(project.items)

  var knobs = {
    3: Observ(0),
    4: Observ(0),
    5: Observ(0),
    6: Observ(0),
    7: Observ(0),
    8: Observ(0)
  }

  var params = []

  Object.keys(knobs).forEach(function (key) {
    var id = 'Launch Control XL > ' + key
    params.push(id)
    context.paramLookup.put(id, MidiParam(context, id, knobs[key]))
  })

  var paramState = []
  watchKnobs(midiPort.stream, mappings.row1.concat(mappings.row2, mappings.row3), function (id, data) {
    var state = paramState[id] = paramState[id] || {}
    var index = Math.floor(id / 8)
    if (index === 0) {
      if (id === 0) {
        project.tempo.set(scaleInterpolate(project.tempo() - 60, data, state) + 60)
      } else if (id === 1) {
        project.swing.set(scaleInterpolate(project.swing() * 128, data, state) / 128)
      } else {
        knobs[id + 1].set(scaleInterpolate(knobs[id + 1](), data, state))
      }
    } else {
      var item = project.items.get(id % 8)
      if (isSetup(item)) {
        var setup = item.node
        var param = index === 1 ? setup.overrideLowPass : setup.overrideHighPass
        var currentValue = getValue(param())
        param.set(scaleInterpolate(currentValue * 128, data, state) / 128)
      }
    }
  })

  var sliderState = []
  watchKnobs(midiPort.stream, mappings.sliders, function (id, data) {
    var state = sliderState[id] = sliderState[id] || {}
    var item = project.items.get(id)
    if (isSetup(item)) {
      var setup = item.node
      var volume = setup.overrideVolume
      var currentPosition = Math.pow(volume(), 1 / Math.E) * 108
      var newPosition = scaleInterpolate(currentPosition, data, state)
      volume.set(Math.pow(newPosition / 108, Math.E))
    }
  }, 108)

  var selectedId = 0
  var buttonBase = computed([project.selected, project.items], function (selected, items) {
    var result = []
    for (var i = 0; i < 8; i++) {
      var item = project.items.get(i)
      if (item) {
        if (item.path === selected) {
          selectedId = i
          result.push(light(2, 3))
        } else {
          result.push(light(0, 1))
        }
      } else {
        result.push(0)
      }
    }
    return result
  })

  var stopButtonBase = Observ([light(1,0),light(1,0),light(1,0),light(1,0),light(1,0),light(1,0),light(1,0),light(1,0)])
  var buttonFlash = FlashArray()
  onTrigger(function (index) {
    if (index === selectedId) {
      buttonFlash.flash(index, light(3, 3), 40)
    } else {
      buttonFlash.flash(index, light(0, 3), 40)
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
      var item = project.items.get(result)
      if (item) {
        project.selected.set(item.path)
      }
    }
  })

  var stopAllButtons = ObservMidi(midiPort.stream, mappings.trackControl, ArrayStack([
    stopButtonBase,
    buttonFlash
  ]))

  stopAllButtons(function (values) {
    var result = null

    values.forEach(function (val, i) {
      if (val) {
        result = i
      }
    })

    if (result != null) {
      var item = project.items.get(result)
      if (item && item.node) {
        suppressNode(item.node, true)
      }
    }
  })

  // CONTROL BUTTONS:
  var controlButtons = LightStack(midiPort.stream, {
    mode: mappings.device
  })

  controlButtons.mode(function (value) {
    if (value || Date.now() - activatedAt > 300) {
      midiPort.override.set(false)
      var activeItem = findItemByPath(project.items, project.selected())
      if (isSetup(activeItem)) {
        activeItem.node.grabInput()
      } else {
        midiPort.previous()
      }
    }
  })

  controlButtons.mode.light(light(2, 2))

  obs.grabInput = function () {
    midiPort.grab()
  }

  obs.destroy = function () {
    midiPort.destroy()
    params.forEach(function (id) {
      context.paramLookup.delete(id)
    })
  }

  return obs

  // scoped

  function suppressNode (node, flatten) {
    if (node && node.controllers) {
      node.controllers.forEach(function (controller) {
        if (controller.looper) {
          var release = controller.looper.transform(function (grid) {
            grid.data = []
            return grid
          })

          if (flatten) {
            controller.looper.flatten()
          } else {
            return release
          }
        }
      })
    }
  }
}

function light (r, g, flag) {
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
