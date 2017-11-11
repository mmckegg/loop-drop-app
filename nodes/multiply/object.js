var Param = require('lib/param')
var ObservStruct = require('mutant/struct')
var Multiply = require('lib/param-multiply')

module.exports = MultiplyModulator

function MultiplyModulator (context) {
  var obs = ObservStruct({
    multiplier: Param(context, 0),
    value: Param(context, 0)
  })

  obs.context = context

  obs.currentValue = Multiply([
    obs.value.currentValue, obs.multiplier.currentValue
  ])

  obs.triggerOn = function (at) {
    Param.triggerOn(obs, at)
  }

  obs.triggerOff = function (at) {
    Param.triggerOff(obs, at)
  }

  return obs
}
