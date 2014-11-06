var Observ = require('observ')
module.exports = function(stream){
  var obs = Observ()
  stream.on('data', obs.set)
  stream.on('data', function(data){
    console.log('rms', data)
  })
  return obs
}