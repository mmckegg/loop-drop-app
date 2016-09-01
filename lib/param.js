var ObservNode = require('observ-node-array/single')
var Event = require('geval')
var deepEqual = require('deep-equal')

module.exports = Param

function Param (context, defaultValue) {
  var obs = ObservNode(context)
  var initial = true
  var queued = []

  setImmediate(function () {
    initial = false
    queued.forEach(broadcast)
    queued.length = 0
  })

  // handle defaultValue
  var set = obs.set
  obs.defaultValue = defaultValue
  obs.set = function (v) {
    if (!deepEqual(v, obs())) {
      set(v == null ? defaultValue : v)
      if (typeof obs() === 'number') {
        var msg = {
          mode: 'log',
          duration: 0.1,
          value: obs(),
          at: context.audio.currentTime
        }
        if (initial) {
          queued.push(msg)
        } else {
          broadcast(msg)
        }
      }
    }
  }

  obs.getValueAt = function (at) {
    if (obs.node && obs.node.getValueAt) {
      return obs.node.getValueAt(at)
    } else {
      return obs.getValue()
    }
  }

  obs.getValue = function () {
    return getValue(obs(), defaultValue)
  }

  obs.context = context

  if (defaultValue != null) {
    set(defaultValue)
  }

  var broadcast = null
  obs.onSchedule = Event(function (b) {
    broadcast = b
  })

  var release = null
  var lastNode = null

  obs.onNode(function (node) {
    if (lastNode) {
      release && release()
      release = null
    }

    if (node) {
      var release = node.onSchedule(broadcast)
    }

    lastNode = node
  })

  obs.triggerOn = function (at) {
    return obs.node && obs.node.triggerOn && obs.node.triggerOn(at) || 0
  }

  obs.triggerOff = function (at) {
    return obs.node && obs.node.triggerOff && obs.node.triggerOff(at) || 0
  }

  obs.getReleaseDuration = function () {
    return obs.node && obs.node.getReleaseDuration && obs.node.getReleaseDuration() || 0
  }

  obs.cancelFrom = function (at) {
    return obs.node && obs.node.cancelFrom && obs.node.cancelFrom(at)
  }

  return obs
}

Param.triggerOn = function (obj, at) {
  for (var k in obj) {
    if (obj[k] && obj[k].triggerOn) {
      obj[k].triggerOn(at)
    }
  }
}

Param.cancelFrom = function (obj, at) {
  for (var k in obj) {
    if (obj[k] && obj[k].cancelFrom) {
      obj[k].cancelFrom(at)
    }
  }
}

Param.triggerOff = function (obj, stopAt) {
  for (var k in obj) {
    if (obj[k] && obj[k].triggerOff) {
      var release = obj[k].getReleaseDuration && obj[k].getReleaseDuration() || 0
      obj[k].triggerOff(stopAt - release)
    }
  }
}

Param.getReleaseDuration = function (obj) {
  var result = 0
  for (var k in obj) {
    if (obj[k] && obj[k].getReleaseDuration) {
      var val = obj[k].getReleaseDuration()
      if (val > result) {
        result = val
      }
    }
  }
  return result
}

function getValue (object, defaultValue) {
  if (object instanceof Object && !Array.isArray(object)) {
    return getValue(object.value, defaultValue)
  } else {
    return object != null ? object : defaultValue
  }
}
