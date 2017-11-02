var Observ = require('mutant/value')
var MidiPort = require('lib/midi-port')
var ObservMidi = require('observ-midi')
var ObservStruct = require('mutant/struct')
var ArrayStack = require('lib/array-stack')
var FlashArray = require('lib/flash-array')
var AnyTrigger = require('lib/on-trigger')
var LightStack = require('observ-midi/light-stack')
var MidiParam = require('lib/midi-to-param')

var computed = require('mutant/computed')
var watchKnobs = require('lib/watch-knobs')
var scaleInterpolate = require('lib/scale-interpolate')
var findItemByPath = require('lib/find-item-by-path')

var turnOffAll = [176 + 8, 0, 0]
var mappings = {
  row1: ['184/21', '184/22', '184/23', '184/24', '184/25', '184/26', '184/27', '184/28'],
  row2: ['184/41', '184/42', '184/43', '184/44', '184/45', '184/46', '184/47', '184/48'],
  buttons: ['152/9', '152/10', '152/11', '152/12', '152/25', '152/26', '152/27', '152/28'],

  up: '184/114',
  down: '184/115',
  left: '184/116',
  right: '184/117'
}

module.exports = function (context) {
  var unloadState = { lastSuppressId: null, lastSuppressAt: 0 }
  var lastSuppress = null
  var turnOffSuppressLight = null

  var midiPort = MidiPort(context, function (port, lastPort) {
    // turn off on switch
    lastPort && lastPort.write(turnOffAll)

    if (port) {
      port.write(turnOffAll)
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
    var id = 'Launch Control > ' + key
    params.push(id)
    context.paramLookup.put(id, MidiParam(context, id, knobs[key]))
  })

  var paramState = []
  watchKnobs(midiPort.stream, mappings.row1, function (id, data) {
    var state = paramState[id] = paramState[id] || {}
    if (id === 0) {
      project.tempo.set(scaleInterpolate(project.tempo() - 60, data, state) + 60)
    } else if (id === 1) {
      project.swing.set(scaleInterpolate(project.swing() * 128, data, state) / 128)
    } else {
      knobs[id + 1].set(scaleInterpolate(knobs[id + 1](), data, state))
    }
  })

  var sliderState = []
  watchKnobs(midiPort.stream, mappings.row2, function (id, data) {
    var state = sliderState[id] = sliderState[id] || {}
    var item = project.items.get(id)
    if (isSetup(item)) {
      var setup = item.node
      var volume = setup.overrideVolume
      var currentPosition = Math.pow(volume(), 1 / Math.E) * 128
      var newPosition = scaleInterpolate(currentPosition, data, state)
      volume.set(Math.pow(newPosition / 128, Math.E))
    }
  }, 127)

  var selectedId = 0
  var buttonBase = computed([project.selected, project.items], function (selected, items) {
    var result = []
    for (var i = 0; i < 8; i++) {
      var item = project.items.get(i)
      if (item) {
        if (item.path() === selected) {
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

  var buttonFlash = FlashArray()
  onTrigger(function (index) {
    if (index === selectedId) {
      buttonFlash.flash(index, light(3, 3), 40)
    } else {
      buttonFlash.flash(index, light(0, 3), 40)
      controlButtons.clearOthers.flash(127, 100)
    }
  })

  var buttons = ObservMidi(midiPort.stream, mappings.buttons, ArrayStack([
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
        project.selected.set(item.path())
      }
    }
  })

  var controlButtons = LightStack(midiPort.stream, {
    clearOthers: mappings.down,
    suppressOthers: mappings.up,
    nudgeLeft: mappings.left,
    nudgeRight: mappings.right
  })

  controlButtons.clearOthers.light(0)

  controlButtons.nudgeLeft(function (value) {
    if (value) {
      controlButtons.nudgeLeft.turnOff = controlButtons.nudgeLeft.light(127)
      project.speed.set(0.95)
    } else {
      controlButtons.nudgeLeft.turnOff && controlButtons.nudgeLeft.turnOff()
      project.speed.set(1)
    }
  })

  controlButtons.nudgeRight(function (value) {
    if (value) {
      controlButtons.nudgeRight.turnOff = controlButtons.nudgeRight.light(127)
      project.speed.set(1.05)
    } else {
      controlButtons.nudgeRight.turnOff && controlButtons.nudgeRight.turnOff()
      project.speed.set(1)
    }
  })

  controlButtons.clearOthers(function (value) {
    if (value) {
      if (unloadState.lastSuppressId === selectedId && unloadState.lastSuppressAt > Date.now() - 500) {
        unloadState.lastSuppressAt = 0
        var toClose = []
        project.items.forEach((item, i) => {
          if (selectedId !== i) toClose.push(item)
        })
        toClose.forEach(x => x.close())
      } else {
        unloadState.lastSuppressId = selectedId
        unloadState.lastSuppressAt = Date.now()
        suppressOthers(true)
      }
    }
  })

  controlButtons.suppressOthers(function (value) {
    if (value) {
      lastSuppress = suppressOthers()
      turnOffSuppressLight = this.light(127)
    } else if (lastSuppress) {
      lastSuppress()
      turnOffSuppressLight && turnOffSuppressLight()
      turnOffSuppressLight = lastSuppress = null
    }
  })

  obs.grabInput = function () {
    midiPort.grab()
  }

  obs.destroy = function () {
    onTrigger.destroy()
    midiPort.destroy()
    params.forEach(function (id) {
      context.paramLookup.delete(id)
    })
  }

  return obs

  // scoped

  function suppressOthers (flatten) {
    var releases = []

    project.items.forEach(function (item) {
      if (item && item.path() !== project.selected()) {
        if (item.node && item.node.controllers) {
          item.node.controllers.forEach(function (controller) {
            if (controller.looper) {
              releases.push(controller.looper.transform(function (grid) {
                grid.data = []
                return grid
              }))

              if (flatten) {
                controller.looper.flatten()
              }
            }
          })
        }
      }
    })

    return function () {
      releases.forEach(invoke)
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

function isSetup (item) {
  return item && item.node && item.node._type === 'LoopDropSetup'
}

function invoke (fn) {
  fn()
}
