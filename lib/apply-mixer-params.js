var computed = require('mutant/computed')
var MutantArray = require('mutant/array')
var resolve = require('mutant/resolve')

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

  var paramOverrideStack = MutantArray([])
  obs.overrideParams = function (params) {
    paramOverrideStack.push(params)
    return function release () {
      paramOverrideStack.delete(params)
    }
  }

  obs.context.paramLookup = ParamLookup(obs.context.paramLookup, params, paramOverrideStack)
}

function ParamLookup (rootParams, params, paramOverrideStack) {
  var raw = {}
  var value = {}
  var paramLookup = computed([rootParams, paramOverrideStack], function (rootValues, overrideStackValues) {
    var keys = []
    for (var k in rootValues) {
      raw[k] = rootParams.get(k)
      value[k] = rootValues[k]
      keys.push(k)
    }

    for (var i = 0; i < params.length; i++) {
      var key = params[i]
      var override = paramOverrideStack.get(paramOverrideStack.getLength() - 1)
      if (override && override[i] != null) {
        var currentValue = override[i].currentValue || override[i]
        value[key] = resolve(currentValue) || 0
        raw[key] = override[i]
      } else {
        value[key] = 0
        raw[key] = 0
      }
      keys.push(key)
    }

    Object.keys(raw).forEach(function (k) {
      if (!keys.includes(k)) {
        delete raw[k]
        delete value[k]
      }
    })

    return value
  })

  paramLookup.get = function (key) {
    return raw[key]
  }

  paramLookup.keys = function (key) {
    return Object.keys(raw)
  }

  return paramLookup
}
