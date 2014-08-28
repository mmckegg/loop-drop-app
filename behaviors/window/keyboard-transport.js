var TapTempo = require('tap-tempo')
var handleKey = require('../../lib/handle-key')

module.exports = function(){
  var clock = window.context.clock
  var tapTempo = TapTempo().on('tempo', function(tempo){
    clock.setTempo(tempo)
  })

  handleKey('down', function(){
    tapTempo.tap()
  })

  // round tempo
  handleKey('up', function(){
    clock.setTempo(Math.round(clock.getTempo()))
  })

  var leftHeld = false
  var rightHeld = false

  handleKey('left', function(){
    clock.setSpeed(0.95)
    leftHeld = true
    checkReset()
  }, function(){
    clock.setSpeed(1)
    leftHeld = false
  })

  handleKey('right', function(){
    clock.setSpeed(1.05)
    rightHeld = true
    checkReset()
  }, function(){
    clock.setSpeed(1)
    rightHeld = false
  })

  function checkReset(){
    if (leftHeld && rightHeld){
      var current = clock.getCurrentPosition()
      var offset = (16 - current) % 16
      clock.setPosition(current + offset)
    }
  }

}



