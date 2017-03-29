var Quantize = require('lib/param-quantize')
var Param = require('lib/param')
var Property = require('lib/property')
var ObservStruct = require('mutant/struct')
var computed = require('mutant/computed')
var Sum = require('lib/param-sum')

module.exports = QuantizeModulator

function QuantizeModulator (context) {
  var obs = ObservStruct({
    grid: Property(1),
    offset: Param(context, 0),
    value: Param(context, 0)
  })

  obs.context = context

  var quantized = computed(obs.grid, grid => {
    return Quantize(obs.value.currentValue, grid)
  })

  obs.currentValue = Sum([
    quantized, obs.offset.currentValue
  ])

  obs.triggerOn = function (at) {
    Param.triggerOn(obs, at)
  }

  obs.triggerOff = function (at) {
    Param.triggerOff(obs, at)
  }

  return obs
}
