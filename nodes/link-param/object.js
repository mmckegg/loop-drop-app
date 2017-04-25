var Value = require('mutant/value')
var ObservStruct = require('mutant/struct')
var Prop = require('lib/property')
var computed = require('mutant/computed')
var watch = require('mutant/watch')
var ParamSource = require('lib/param-source')

var Param = require('lib/param')
var Multiply = require('lib/param-multiply')
var Sum = require('lib/param-sum')
var Negate = require('lib/param-negate')
var Quantize = require('lib/param-quantize')

module.exports = LinkParam

function LinkParam (context) {
  var obs = ObservStruct({
    param: Value(),
    minValue: Param(context, 0),
    maxValue: Param(context, 1),
    mode: Prop('linear'),
    quantize: Prop(0)
  })

  var releases = []

  obs._type = 'LinkParam'
  obs.context = context

  var range = Sum([
    obs.maxValue,
    Negate(obs.minValue)
  ])

  releases.push(
    watch(range) // HACK: avoid regenerating transform AudioNodes
  )

  // only relink params if the param we want changes
  var param = computed([context.paramLookup, obs.param], (paramLookup, paramId) => {
    return context.paramLookup.get(paramId)
  }, {
    passthru: true // treat nested observables as values instead of expanding
  })

  var inverted = computed([range], range => {
    return isNegative(range, context.audio.currentTime)
  })

  obs.currentValue = computed([obs.mode, obs.quantize, inverted, param], function (mode, quantize, inverted, param) {
    console.log('recompute')
    if (param) {
      if (mode === 'exp') {
        if (inverted) {
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
        result = Quantize(result, quantize)
      }

      return result
    } else {
      return obs.minValue.currentValue
    }
  }, {
    nextTick: true,
    comparer: (a, b) => {
      // also compare AudioNodes and ParamSources
      if (a instanceof global.AudioNode || ParamSource.isParam(a)) {
        return a === b
      }
    }
  })

  obs.destroy = function () {
    Param.destroy(obs)
    while (releases.length) {
      releases.pop()()
    }
  }

  return obs
}

function isNegative (value, at) {
  if (typeof value === 'number') {
    return value < 0
  } else if (value && value.getValueAtTime) {
    return value.getValueAtTime(at) < 0
  }
}
