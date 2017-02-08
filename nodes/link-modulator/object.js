var Observ = require('mutant/value')
var ObservStruct = require('mutant/struct')
var computed = require('mutant/computed')

var Param = require('lib/param')
var Sum = require('lib/param-sum')

module.exports = ParamModulator

function ParamModulator (context) {
  var obs = ObservStruct({
    param: Observ(),
    value: Param(context, 0)
  })

  obs._type = 'ParamModulator'

  obs.context = context

  var offsetValue = computed([obs.param, context.paramLookup], function (param) {
    return context.paramLookup.get(param)
  })

  obs.currentValue = Sum([obs.value, offsetValue])

  obs.destroy = function () {
    Param.destroy(obs)
  }

  return obs
}
