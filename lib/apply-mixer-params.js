var computed = require('@mmckegg/mutant/computed')
var ObservArray = require('observ-array')

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
        value[key] = typeof override[i] === 'function' ? override[i]() : override[i] || 0
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
  })

  paramLookup.get = function (key) {
    return raw[key]
  }

  paramLookup.keys = function (key) {
    return Object.keys(raw)
  }

  return paramLookup
}
