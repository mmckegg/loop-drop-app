var Prop = require('lib/property')
var Event = require('geval')
var duplexStreamCache = new Map()
var outputStreamCache = new Map()
var duplexStacks = new Map()
var outputStacks = new Map()

module.exports = MidiPort

// grab exclusive access to a midi port (unless opts.shared is provided)

function MidiPort (context, onSwitch, opts) {
  var ports = context.midiPorts
  var isOutput = opts && opts.output
  var isShared = opts && opts.shared
  var streamCache = isOutput ? outputStreamCache : duplexStreamCache

  // opt out of exclusive port
  var stacks = isShared
    ? new Map()
    : isOutput ? outputStacks : duplexStacks

  var obs = Prop()
  var nextValue = null
  var settingNext = false
  obs.override = Prop(false)

  obs.stream = Prop()
  obs(refresh)

  var listeners = [
    ports(refresh)
  ]

  var broadcastClose = null
  obs.stream.onClose = Event(b => { broadcastClose = b })

  obs.stream.write = function (value, timestamp) {
    if (obs.stream()) {
      obs.stream().write(value, timestamp)
    }
  }

  obs.grab = function () {
    var stack = stacks.get(obs())
    if (stack && last(stack) !== obs) {
      var lastTop = last(stack)
      if (!lastTop.override()) {
        var index = stack.indexOf(obs)
        if (~index) {
          stack.splice(index, 1)
        }
        stack.push(obs)
        lastTop && lastTop.refresh()
        refresh()
      }
    }
  }

  obs.refresh = refresh

  obs.next = function () {
    var stack = stacks.get(obs())
    if (stack && last(stack) === obs) {
      stack[0].grab()
    }
  }

  obs.previous = function () {
    var stack = stacks.get(obs())
    if (stack && last(stack) === obs) {
      var previous = stack[stack.length - 2]
      if (previous) {
        previous.grab()
      }
    }
  }

  obs.destroy = function () {
    broadcastClose()
    while (listeners.length) {
      listeners.pop()()
    }
    obs.stream.set(null)
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
    var portNames = ports() || []
    var portName = obs()
    var exists = !!~portNames.indexOf(portName)
    if (!streamCache.has(portName) && exists) {
      if (opts && opts.output) {
        streamCache.set(portName, ports.openOutput(portName, {
          normalizeNotes: true
        }))
      } else {
        streamCache.set(portName, ports.open(portName, {
          normalizeNotes: true
        }))
      }
    } else if (streamCache.has(portName) && !exists) {
      streamCache.get(portName).close()
      streamCache.delete(portName)
    }

    var stack = stacks.get(portName)
    if (!stack) {
      stack = []
      stacks.set(portName, stack)
    }
    if (stack && !stack.length) {
      stack.push(obs)
    }

    // ensure not in any other stacks
    Array.from(stacks.values()).filter(v => v !== stack).forEach(function (stack) {
      var index = stack.indexOf(obs)
      if (~index) {
        stack.splice(index, 1)
        if (stack.length) {
          last(stack).refresh()
        }
      }
    })

    if (exists && last(stack) === obs) {
      setNextValue(streamCache.get(portName))
    } else {
      setNextValue(null)
    }
  }

  function setNextValue (value) {
    if ((settingNext && nextValue !== value) || value !== obs.stream()) {
      onSwitch && onSwitch(value, obs.stream())
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
