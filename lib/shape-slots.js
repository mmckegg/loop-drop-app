var deepEqual = require('deep-equal')
var computed = require('mutant/computed')

module.exports = ShapeSlots

function ShapeSlots (shape) {
  var result = []
  return computed(deepMatch(shape), (shape) => {
    var newLength = (Array.isArray(shape) && shape[0] * shape[1]) || 0
    var currentLength = result.length
    if (currentLength !== newLength) {
      for (var i = currentLength; i < newLength; i++) {
        result[i] = i
      }
      result.length = newLength
      return result
    } else {
      return computed.NO_CHANGE
    }
  })
}

function deepMatch (obs) {
  var lastValue = null
  return computed(obs, function (value) {
    value = value == null ? null : value
    if (!deepEqual(lastValue, value)) {
      lastValue = JSON.parse(JSON.stringify(value))
      return value
    } else {
      return computed.NO_CHANGE
    }
  })
}
