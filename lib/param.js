var ObservNode = require('observ-node-array/single')
var computed = require('@mmckegg/mutant/computed')
var deepEqual = require('deep-equal')

module.exports = Param

function Param (context, defaultValue) {
  var obs = ObservNode(context)

  // handle defaultValue
  var set = obs.set
  obs.defaultValue = defaultValue
  obs.set = function (v) {
    if (!deepEqual(v, obs())) {
      set(v == null ? defaultValue : v)
    }
  }

  obs.context = context

  if (defaultValue != null) {
    set(defaultValue)
  }

  obs.currentValue = computed([obs], function (value) {
    if (typeof value === 'number') {
      return value
    } else if (obs.node && obs.node.currentValue) {
      return obs.node.currentValue
    }
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

  return obs
}

Param.triggerOn = function (obj, at) {
  for (var k in obj) {
    if (obj[k] && obj[k].triggerOn) {
      obj[k].triggerOn(at)
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

Param.destroy = function (obj) {
  Object.keys(obj).forEach(function (key) {
    if (obj[key] && typeof obj[key].destroy === 'function') {
      obj[key].destroy()
    }
  })
}
