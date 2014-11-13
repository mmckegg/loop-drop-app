var Observ = require('observ')
module.exports = function(stream){
  var obs = Observ()
  stream.on('data', obs.set)
  return obs
}