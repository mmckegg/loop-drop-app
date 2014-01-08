var Through = require('through')

module.exports = function(){
  var stream = Through(function(data){
    stream.remote.queue(data)
  }, function(){
    stream.remote.queue(null)
  })

  stream.remote = Through(function(data){
    stream.queue(data)
  }, function(){
    stream.queue(null)
  })
  return stream
}