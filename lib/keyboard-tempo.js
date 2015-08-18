module.exports = function(context) {
  var actions = context.actions
  var tempo = context.tempo
  var speed = context.speed

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
          actions.tapTempo()
        }
      } else if (e.keyCode === 37) { // left arrow
        if (isDown) {
          speed.set(0.95)
        } else {
          speed.set(1)
        }
      } else if (e.keyCode === 39) { // right arrow
        if (isDown) {
          speed.set(1.05)
        } else {
          speed.set(1)
        }
      } else if (e.keyCode === 38) {
        if (isDown) {
          if (speed() > 1) {
            tempo.set(tempo()+1)
          } else if (speed() < 1) {
            tempo.set(tempo()-1)
          } else {
            tempo.set(Math.round(tempo()))
          }
        }
      }
    }
  }
}

function shouldIgnore(el){
  return (el.nodeName === 'INPUT' && el.type !== 'range' && el.type !== 'checkbox') || 
          el.nodeName === 'TEXTAREA'
}