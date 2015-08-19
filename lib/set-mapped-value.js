var watch = require('observ/watch')
module.exports = function(values, obs, target){
  var lastValue = undefined
  return watch(obs, function(data){
    for (var i=values.length-1;i>=0;i--) {
      if (data[i]) {
        if (target() !== values[i]) {
          target.set(values[i])
        }
        break
      }
    }
  })
}