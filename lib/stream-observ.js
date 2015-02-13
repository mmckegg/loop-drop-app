var hg = require('mercury')
module.exports = function(stream){
  var obs = hg.value()
  stream.on('data', obs.set)
  return obs
}