var ObservStruct = require('@mmckegg/mutant/struct')
var ObservMidi = require('observ-midi')
var MutantArray = require('@mmckegg/mutant/array')
var computed = require('@mmckegg/mutant/computed')
var MidiPort = require('lib/midi-port')

var ArrayStack = require('lib/array-stack')
var FlashArray = require('lib/flash-array')
var AnyTrigger = require('lib/on-trigger')
var MidiParam = require('lib/midi-to-param')
var LightStack = require('observ-midi/light-stack')

var watchThrottle = require('@mmckegg/mutant/watch-throttle')
var throttle = require('@mmckegg/mutant/throttle')

module.exports = LaunchControl

function LaunchControl (context) {
  var midiPort = MidiPort(context)

  var obs = ObservStruct({
    port: midiPort
  })

  var releases = []

  var project = context.project
  var setups = MutantArray([])

  releases.push(project.items.onLoad(addItem))
  setImmediate(function () {
    project.items.forEach(addItem)
  })

  function addItem (item) {
    if (item.node._type === 'LoopDropSetup') {
      for (var i = 0; i <= setups._list.length; i++) {
        if (!setups._list[i]) {
          setups.put(i, item)
          item.onClose(function () {
            setups.put(i, null)
          })
          break
        }
      }
    }
  }

  var onTrigger = AnyTrigger(setups)

  // FIRST ROW OF KNOBS:
  var knobs = ObservMidi(midiPort.stream, {
    tempo: '184/21',
    swing: '184/22',
    param3: '184/23',
    param4: '184/24',
    param5: '184/25',
    param6: '184/26',
    param7: '184/27',
    param8: '184/28'
  })

  watchThrottle(knobs.tempo, 20, function(value) {
    if (value != null) {
      project.tempo.set(value+60)
    }
  })


  watchThrottle(knobs.swing, 20, function(value) {
    if (value != null) {
      project.swing.set(value / 128)
    }
  })

  var params = [
    MidiParam(context, 'Launch Control > 3', throttle(knobs.param3)),
    MidiParam(context, 'Launch Control > 4', throttle(knobs.param4)),
    MidiParam(context, 'Launch Control > 5', throttle(knobs.param5)),
    MidiParam(context, 'Launch Control > 6', throttle(knobs.param6)),
    MidiParam(context, 'Launch Control > 7', throttle(knobs.param7)),
    MidiParam(context, 'Launch Control > 8', throttle(knobs.param8)),
  ]

  params.forEach(function(param) {
    context.paramLookup.put(param.id(), param)
  })
  //////



  // SECOND ROW OF KNOBS:
  var volumes = ObservMidi(midiPort.stream, [
    '184/41',
    '184/42',
    '184/43',
    '184/44',
    '184/45',
    '184/46',
    '184/47',
  ])

  volumes(function (values) {
    values.forEach(function (val, i) {
      var item = setups.get(i)
      if (item && item.node.output) {

        if (val == null) {
          val = 64
        }

        item.node.output.gain.value = (val / 64)
      }

    })
  })
  ////////


  // CONTROL BUTTONS:
  var controlButtons = LightStack(midiPort.stream, {
    clearOthers: '184/115',
    suppressOthers: '184/114',
    tap: '152/28',
    nudgeLeft: '184/116',
    nudgeRight: '184/117'
  })

  controlButtons.tap.light(light(0, 1))
  controlButtons.clearOthers.light(0)

  controlButtons.tap(function (value) {
    if (value) {
      controlButtons.tap.flash(light(0,2))
      project.actions.tapTempo()
    }
  })

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
      suppressOthers(true)
    }
  })

  var lastSuppress = null
  var turnOffSuppressLight = null

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
  ///


  // SELECT BUTTONS:
  var selectedButton = null
  var buttonBase = computed([setups, project.selected], function(items, selected) {
    var result = []
    for (var i=0;i<8;i++) {
      var item = setups.get(i)
      if (item) {
        if (item.path() === selected) {
          result.push(light(2, 3))
          selectedButton = i
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
  onTrigger(function(i) {

    if (i === selectedButton) {
      buttonFlash.flash(i, light(3, 3), 40)
    } else {
      buttonFlash.flash(i, light(3, 0), 40)
      controlButtons.clearOthers.flash(127, 100)
    }
  })

  var buttons = ObservMidi(midiPort.stream, [
    '152/9',
    '152/10',
    '152/11',
    '152/12',
    '152/25',
    '152/26',
    '152/27',
  ], ArrayStack([
    buttonBase,
    buttonFlash
  ]))


  buttons(function (values) {
    var result = null

    values.forEach(function(val, i) {
      if (val) {
        result = i
      }
    })

    if (result != null) {
      var item = setups.get(result)
      if (item) {
        project.selected.set(item.path())
      }
    }
  })

  obs.destroy = function () {
    setups.set([])
    while (releases.length) {
      releases.pop()()
    }
    midiPort.destroy()
    params.forEach(function(param) {
      context.paramLookup.delete(param.id())
    })
  }

  return obs

  // scoped

  function suppressOthers (flatten) {
    var releases = []

    setups.forEach(function (item) {
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

function invoke (fn) {
  fn()
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
