var TapTempo = require('tap-tempo')

module.exports = function(targetTempo, targetSpeed) {
  var tapTempo = TapTempo()

  tapTempo.on('tempo', targetTempo.set)

  document.addEventListener('keydown', handleEvent, false)
  document.addEventListener('keyup', handleEvent, false)

  return function(){
    document.removeEventListener('keydown', handleEvent, false)
    document.removeEventListener('keyup', handleEvent, false)
    tapTempo.removeAllListeners()
  }

  function handleEvent(e) {
    var el = document.activeElement
    if (!el || (!shouldIgnore(el) && el.contentEditable !== 'true')) {
      var isDown = e.type === 'keydown'
      if (e.keyCode === 40) { // down arrow
        if (isDown) {
          tapTempo.tap()
        }
      } else if (e.keyCode === 37) { // left arrow
        if (isDown) {
          targetSpeed.set(0.95)
        } else {
          targetSpeed.set(1)
        }
      } else if (e.keyCode === 39) { // right arrow
        if (isDown) {
          targetSpeed.set(1.05)
        } else {
          targetSpeed.set(1)
        }
      }
    }
  }
}

function shouldIgnore(el){
  return (el.nodeName === 'INPUT' && el.type !== 'range' && el.type !== 'checkbox') || 
          el.nodeName === 'TEXTAREA'
}