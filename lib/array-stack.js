var computed = require('observ/computed')

module.exports = ArrayStack

function ArrayStack (items) {
  return computed(items, function(_) {
    var result = []
    for (var i = 0; i < arguments.length; i++) {
      var arr = arguments[i]
      for (var k = 0; k < arr.length; k++) {
        if (arr[k] != null) {
          result[k] = arr[k]
        }
      }
    }
    return result
  })
}