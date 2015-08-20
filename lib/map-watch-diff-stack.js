var watch = require('observ/watch')
module.exports = function(values, obs, handler){
  var stack = []
  var lastValue = undefined
  return watch(obs, function(data){
    data._diff&&Object.keys(data._diff).forEach(function(key){
      var value = values[key]
      if (data._diff[key]){
        stack.push(value)
      } else {
        remove(stack, value)
      }
    })
    var top = stack[stack.length-1]

    if (top == null){
      top = lastValue
    }

    if (top !== lastValue){
      handler(top)
      lastValue = top
    }
  })
}

function remove(array, item){
  var index = array.indexOf(item)
  if (~index){
    array.splice(index, 1)
  }
}