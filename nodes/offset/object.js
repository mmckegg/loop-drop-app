var Param = require('lib/param')
var ObservStruct = require('mutant/struct')
var Sum = require('lib/param-sum')

module.exports = OffsetModulator

function OffsetModulator (context) {
  var obs = ObservStruct({
    offset: Param(context, 0),
    value: Param(context, 0)
  })

  obs.context = context

  obs.currentValue = Sum([
    obs.value.currentValue, obs.offset.currentValue
  ])

  obs.triggerOn = function (at) {
    Param.triggerOn(obs, at)
  }

  obs.triggerOff = function (at) {
    Param.triggerOff(obs, at)
  }

  return obs
}
