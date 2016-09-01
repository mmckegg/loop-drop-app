var Observ = require('@mmckegg/mutant/value')
var ObservStruct = require('observ-struct')
var Param = require('lib/param')
var Event = require('geval')

module.exports = ValueModulator

function ValueModulator (parentContext) {
  var context = Object.create(parentContext)

  var obs = ObservStruct({
    id: Observ(),
    value: Param(context, 1)
  })

  obs._type = 'ValueModulator'
  context.slot = obs

  var broadcast = null
  obs.onSchedule = Event(function (b) {
    broadcast = b
  })

  obs.value.onSchedule(function (value) {
    // only send modulations while triggering
    if (lastTriggerOn > lastTriggerOff) {
      broadcast(value)
    }
  })

  obs.context = context

  var lastTriggerOn = -1
  var lastTriggerOff = 0

  obs.triggerOn = function (at) {
    at = at || context.audio.currentTime
    lastTriggerOn = at

    Param.triggerOn(obs, at)

    if (!obs.value.node) {
      broadcast({ value: obs.value.getValue(), at: at })
    }
  }

  obs.triggerOff = function (at) {
    at = at || context.audio.currentTime

    var stopAt = obs.getReleaseDuration() + at
    Param.triggerOff(obs, stopAt)

    if (!obs.value.node) {
      broadcast({ value: 0, at: at })
    }

    lastTriggerOff = at
    return stopAt
  }

  obs.getReleaseDuration = Param.getReleaseDuration.bind(this, obs)
  obs.destroy = obs.value.destroy

  return obs
}
