var Through = require('through')

module.exports = function(){
  var keystream = Through()

  function send(e){
    keystream.write(e)
  }

  document.addEventListener('keydown', send)
  document.addEventListener('keyup', send)

  return keystream
}