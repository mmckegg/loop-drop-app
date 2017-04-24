var ParamSource = require('lib/param-source')
var Param = require('lib/param')
var ObservStruct = require('mutant/struct')
var resolve = require('mutant/resolve')

module.exports = HoldModulator

function HoldModulator (context) {
  var obs = ObservStruct({
    attack: Param(context, 0),
    value: Param(context, 0)
  })

  obs.context = context
  obs.currentValue = ParamSource(context, 0)

  obs.triggerOn = function (at) {
    var value = obs.value.getValueAtTime(at)
    var attackTime = obs.attack.getValueAtTime(at)
    if (attackTime) {
      obs.currentValue.cancelScheduledValues(at)
      obs.currentValue.setTargetAtTime(value, at, attackTime / 8)
    } else {
      obs.currentValue.setValueAtTime(value, at)
    }
    Param.triggerOn(obs, at)
  }

  obs.triggerOff = function (at) {
    Param.triggerOff(obs, at)
  }

  return obs
}
