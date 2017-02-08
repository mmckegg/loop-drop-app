var Observ = require('@mmckegg/mutant/value')
var ObservStruct = require('@mmckegg/mutant/struct')
var Param = require('lib/param')
var computed = require('@mmckegg/mutant/computed')
var ParamSource = require('lib/param-source')

module.exports = ValueModulator

function ValueModulator (parentContext) {
  var context = Object.create(parentContext)

  var obs = ObservStruct({
    id: Observ(),
    value: Param(context, 1)
  })

  obs._type = 'ValueModulator'
  obs.context = context
  context.slot = obs

  var outputValue = ParamSource(context, 0)
  obs.currentValue = computed([outputValue, obs.value.currentValue], function (outputValue, paramValue) {
    if (typeof paramValue === 'number') {
      return outputValue
    } else {
      return paramValue
    }
  })

  obs.triggerOn = function (at) {
    at = at || context.audio.currentTime
    outputValue.setTargetAtTime(getValue(obs.value), at, 0.001)
    Param.triggerOn(obs, at)
  }

  obs.triggerOff = function (at) {
    at = at || context.audio.currentTime
    var stopAt = obs.getReleaseDuration() + at
    Param.triggerOff(obs, stopAt)
    outputValue.setTargetAtTime(0, stopAt, 0.001)
    return stopAt
  }

  obs.getReleaseDuration = Param.getReleaseDuration.bind(this, obs)

  obs.destroy = function () {
    Param.destroy(obs)
  }

  return obs
}

function getValue (param) {
  if (param.currentValue) {
    var value = param.currentValue()
    if (typeof value === 'number') {
      return value
    } else {
      return 0
    }
  }
}
