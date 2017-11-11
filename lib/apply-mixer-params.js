var computed = require('mutant/computed')
var MutantArray = require('mutant/array')
var resolve = require('mutant/resolve')

var params = ['A', 'B', 'C']

module.exports = function (context) {
  var paramOverrideStack = MutantArray([])
  context.paramLookup = ParamLookup(context.paramLookup, params, paramOverrideStack)
  return function (params) {
    paramOverrideStack.push(params)
    return function release () {
      paramOverrideStack.delete(params)
    }
  }
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
        keys.push(key)
      }
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

module.exports.params = function (obs) {
  // hack for mixer params
  return computed([obs], function (values) {
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
}
