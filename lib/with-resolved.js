var computed = require('observ/computed')
var extend = require('xtend')

module.exports = withResolved

function withResolved (obj, keys) {
  var result = computed(keys.map(function (k) { return obj[k] }).concat(obj), function (args) {
    var resolvedValues = Array.from(arguments).slice(0, -1)
    var value = extend(arguments[arguments.length - 1])
    keys.forEach(function (key, i) {
      value[key] = resolvedValues[i]
    })
    return value
  })

  for (var k in obj) {
    if (k !== 'set' && k !== 'destroy') {
      result[k] = obj[k]
    }
  }

  result.node = obj
  return result
}
