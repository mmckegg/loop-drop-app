var computed = require('observ/computed')
var ObservVarhash = require('observ-varhash')
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
  obs.context.paramLookup = ParamLookup(obs.context.paramLookup, Property(params), obs.paramValues)
}

function ParamLookup (rootParams, params, rawParamValues) {
  var raw = {}
  var paramLookup = computed([rootParams, params, rawParamValues], function (rootParams, params, values) {
    var result = extend(rootParams)
    var rawResult = extend(rootParams)
    for (var i = 0; i < params.length; i++) {
      var key = params[i]
      result[key] = values && values[key] || 0
      rawResult[key] = rawParamValues.get(key)
    }
    raw = rawResult
    return result
  })

  paramLookup.get = function (key) {
    return raw[key]
  }

  paramLookup.keys = function (key) {
    return Object.keys(raw)
  }

  return paramLookup
}
