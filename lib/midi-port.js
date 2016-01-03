var Prop = require('observ-default')

var streamCache = new Map()
var stacks = new Map()

module.exports = MidiPort

function MidiPort (context, onSwitch) {
  var ports = context.midiPorts

  var obs = Prop()
  var nextValue = null
  var settingNext = false

  obs.stream = Prop()

  var listeners = [
    obs(refresh),
    ports(refresh)
  ]

  obs.stream.write = function (value) {
    if (obs.stream()) {
      obs.stream().write(value)
    }
  }

  obs.grab = function () {
    var stack = stacks.get(obs())
    if (stack && last(stack) !== obs) {
      var lastTop = last(stack)
      var index = stack.indexOf(obs)
      if (~index) {
        stack.splice(index, 1)
      }
      stack.push(obs)
      lastTop && lastTop.refresh()
      refresh()
    }
  }

  obs.refresh = refresh

  obs.next = function () {
    var stack = stacks.get(obs())
    if (stack && last(stack) === obs) {
      stack[0].grab()
    }
  }

  obs.destroy = function () {
    while (listeners.length) {
      listeners.pop()()
    }
    setNextValue(null)
    var stack = stacks.get(obs())
    if (stack) {
      var index = stack.indexOf(obs)
      if (~index) {
        stack.splice(index, 1)
        if (stack.length) {
          last(stack).refresh()
        }
      }
    }
  }

  return obs

  // scoped

  function refresh () {
    var portNames = ports()
    var portName = obs()
    var exists = !!~portNames.indexOf(portName)
    if (!streamCache.has(portName) && exists) {
      streamCache.set(portName, ports.open(portName, {
        normalizeNotes: true
      }))
      stacks.set(portName, [])
    }
    var stack = stacks.get(portName)
    if (stack && !stack.length) {
      stack.push(obs)
    }
    if (exists && last(stack) === obs) {
      setNextValue(streamCache.get(portName))
    } else {
      setNextValue(null)
    }
  }

  function setNextValue (value) {
    if (settingNext && nextValue !== value || value !== obs.stream()) {
      onSwitch(value, obs.stream())
      nextValue = value
      if (!settingNext) {
        settingNext = true
        setImmediate(function () {
          obs.stream.set(nextValue)
          settingNext = false
        })
      }
    }
  }
}

function last (array) {
  return array[array.length - 1]
}
