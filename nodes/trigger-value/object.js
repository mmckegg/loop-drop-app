var Observ = require('@mmckegg/mutant/value')
var ObservStruct = require('@mmckegg/mutant/struct')
var Param = require('lib/param')
var Apply = require('lib/apply-param')
var createVoltage = require('lib/create-voltage')

module.exports = ValueModulator

function ValueModulator (parentContext) {
  var context = Object.create(parentContext)

  var obs = ObservStruct({
    id: Observ(),
    value: Param(context, 1)
  })

  obs._type = 'ValueModulator'
  context.slot = obs

  obs.context = context
  obs.currentValue = context.audio.createGain()

  var amp = context.audio.createGain()
  amp.connect(obs.currentValue)

  var unwatch = Apply(context, amp.gain, obs.value)
  var lastSource = null
  var triggeredTo = 0

  obs.triggerOn = function (at) {
    at = at || context.audio.currentTime

    if (at < triggeredTo) {
      lastSource.stop(at + 1000) // HACK: cancel off
      triggeredTo = at + 1000
    } else {
      lastSource = createVoltage(context.audio)
      lastSource.connect(amp)
      lastSource.start(at)
      triggeredTo = Infinity
    }

    Param.triggerOn(obs, at)
  }

  obs.triggerOff = function (at) {
    at = at || context.audio.currentTime
    var stopAt = obs.getReleaseDuration() + at

    if (at < triggeredTo) {
      lastSource.stop(stopAt)
      triggeredTo = stopAt
    }

    Param.triggerOff(obs, stopAt)

    return stopAt
  }

  obs.getReleaseDuration = Param.getReleaseDuration.bind(this, obs)

  obs.destroy = function () {
    Param.destroy(obs)
    unwatch()
  }

  return obs
}
