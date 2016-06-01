var computed = require('observ/computed')
var ObservVarhash = require('observ-varhash')
var Observ = require('observ')
var extend = require('xtend')
var Property = require('observ-default')

module.exports = function (obs) {
  // hack for mixer params
  var params = ['A', 'B', 'C']
  obs.params = computed([obs], function (values) {
    var usedParams = []
    JSON.stringify(values, function (key, value) {
      if (value && value.node === 'linkParam') {
        var index = params.indexOf(value.param)
        if (~index) {
          usedParams[index] = value.param
        }
      }
      return value
    })
    return usedParams
  })

  obs.paramValues = ObservVarhash({})
  obs.context.paramLookup = ParamLookup(obs.context.paramLookup, params, obs.paramValues)
  return obs.context.paramLookup.destroy
}

function ParamLookup (rootParams, params, paramValues) {
  var raw = {}
  var paramLookup = Observ()

  function refresh () {
    var result = extend(rootParams())
    var rawResult = extend(rootParams())
    for (var i = 0; i < params.length; i++) {
      var key = params[i]
      result[key] = paramValues() && paramValues()[key] || 0
      rawResult[key] = paramValues.get(key)
    }
    raw = rawResult
    paramLookup.set(result)
  }

  var releases = [
    rootParams(refresh),
    paramValues(refresh)
  ]

  paramLookup.destroy = function () {
    while (releases.length) {
      releases.pop()()
    }
  }

  paramLookup.get = function (key) {
    return raw[key]
  }

  paramLookup.keys = function (key) {
    return Object.keys(raw)
  }

  return paramLookup
}
