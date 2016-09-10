var Value = require('@mmckegg/mutant/value')
var doubleBind = require('lib/double-bind')
var computed = require('@mmckegg/mutant/computed')
var resolveNode = require('lib/resolve-node')
var getValue = require('lib/get-value')

module.exports = Param

function Param (context, defaultValue) {
  var obs = Value(defaultValue, { defaultValue })
  obs.nodeName = computed([obs], x => x && x.node || false)

  obs.context = context
  obs.node = null

  var releases = []

  obs.currentValue = computed([obs.nodeName], function (nodeName) {
    var ctor = resolveNode(context.nodes, nodeName)

    // clean up last
    obs.node = null
    while (releases.length) {
      releases.pop()()
    }

    if (ctor) {
      var instance = ctor(context)
      releases.push(doubleBind(obs, instance))

      if (instance.destroy) {
        releases.push(instance.destroy)
      }

      obs.node = instance
      return instance.currentValue
    } else {
      return computed(obs, getValue, {nextTick: true})
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

  obs.destroy = function () {
    while (releases.length) {
      releases.pop()()
    }
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
