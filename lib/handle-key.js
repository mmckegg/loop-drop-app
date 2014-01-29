var convertKeyCode = require('keycode')
var ignore = ['INPUT', 'TEXTAREA', 'SELECT']

module.exports = function(keyCode, on, off){

  if (Array.isArray(keyCode)){
    keyCode = keyCode.map(getKeyCode)
  } else {
    keyCode = getKeyCode(keyCode)
  }

  if (on){
    document.addEventListener('keydown', function(e){
      if (matchEvent(keyCode, e)) {
        e.preventDefault()
        e.stopPropagation()
        on(e)
      }
    })
  }
  if (off){
    document.addEventListener('keyup', function(e){
      if (matchEvent(keyCode, e)) {
        e.preventDefault()
        e.stopPropagation()
        off(e)
      }
    })
  }
}

function matchEvent(keyCode, e){
  if (!document.activeElement || !~ignore.indexOf(document.activeElement.nodeName)){
    if (Array.isArray(keyCode)){
      e.index = keyCode.indexOf(e.keyCode)
      return ~keyCode.indexOf(e.keyCode)
    } else {
      return keyCode == e.keyCode
    }
  } else {
    return false
  }
}

function getKeyCode(input){
  if (typeof input === 'string'){
    return convertKeyCode(input)
  } else {
    return input
  }
}