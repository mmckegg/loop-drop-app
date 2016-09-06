var Observ = require('@mmckegg/mutant/value')
var ObservStruct = require('@mmckegg/mutant/struct')
var Prop = require('observ-default')
var computed = require('@mmckegg/mutant/computed')

var Param = require('lib/param')
var Multiply = require('lib/param-multiply')
var Sum = require('lib/param-sum')
var Negate = require('lib/param-negate')

module.exports = LinkParam

function LinkParam (context) {
  var obs = ObservStruct({
    param: Observ(),
    minValue: Param(context, 0),
    maxValue: Param(context, 1),
    mode: Prop('linear'),
    quantize: Prop(0)
  })

  obs._type = 'LinkParam'
  obs.context = context

  var range = Sum([
    obs.maxValue,
    Negate(obs.minValue)
  ])

  // transform: value * (maxValue - minValue) + minValue

  obs.currentValue = computed([obs.param, obs.mode, obs.quantize, range, context.paramLookup], function (paramId, mode, quantize, range) {
    var param = context.paramLookup.get(paramId)
    if (param) {
      if (mode === 'exp') {
        if (typeof range === 'number' && range < 0) {
          var oneMinusParam = Sum([param, -1])
          param = Sum([
            1, Negate(Multiply([oneMinusParam, oneMinusParam]))
          ])
        } else {
          param = Multiply([param, param])
        }
      }

      var result = Sum([
        Multiply([param, range]),
        obs.minValue
      ])

      if (quantize) {
        // TODO
      }

      return result
    } else {
      return obs.minValue.currentValue
    }
  }, { nextTick: true })

  obs.destroy = function () {
    Param.destroy(obs)
  }

  return obs
}

// function quantize (value, grid) {
//   if (grid) {
//     return Math.round(value * grid) / grid
//   } else {
//     return value
//   }
// }
