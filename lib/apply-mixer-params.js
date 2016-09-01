var computed = require('@mmckegg/mutant/computed')
var ObservArray = require('observ-array')
var Observ = require('@mmckegg/mutant/value')
var extend = require('xtend')

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

  var paramOverrideStack = ObservArray([])
  obs.overrideParams = function (params) {
    paramOverrideStack.push(params)
    return function release () {
      var index = paramOverrideStack.indexOf(params)
      if (~index) {
        paramOverrideStack.splice(index, 1)
      }
    }
  }

  obs.context.paramLookup = ParamLookup(obs.context.paramLookup, params, paramOverrideStack)
  return obs.context.paramLookup.destroy
}

function ParamLookup (rootParams, params, paramOverrideStack) {
  var raw = {}
  var paramLookup = Observ()

  function refresh () {
    var result = extend(rootParams())
    var rawResult = extend(rootParams._raw)
    for (var i = 0; i < params.length; i++) {
      var key = params[i]
      var override = paramOverrideStack.get(paramOverrideStack.getLength() - 1)
      if (override && override[i] != null) {
        result[key] = typeof override[i] === 'function' ? override[i]() : override[i] || 0
        rawResult[key] = override[i]
      } else {
        result[key] = 0
        rawResult[key] = 0
      }
    }
    raw = rawResult
    paramLookup.set(result)
  }

  var releases = [
    rootParams(refresh),
    paramOverrideStack(refresh)
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
