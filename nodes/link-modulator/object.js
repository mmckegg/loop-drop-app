var Observ = require('@mmckegg/mutant/value')
var ObservStruct = require('@mmckegg/mutant/struct')
var computed = require('@mmckegg/mutant/computed')

var Param = require('lib/param')
var Transform = require('lib/param-transform')

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

  obs.currentValue = Transform(obs.value, offsetValue, 'add')

  obs.destroy = function () {
    Param.destroy(obs)
  }

  return obs
}
