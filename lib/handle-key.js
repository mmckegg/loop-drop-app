module.exports = function(keyCode, on, off){
  if (on){
    document.addEventListener('keydown', function(e){
      if (matchEvent(keyCode, e)) {
        e.preventDefault()
        e.stopPropagation()
        on(e)
      }
    }, true)
  }
  if (off){
    document.addEventListener('keyup', function(e){
      if (matchEvent(keyCode, e)) {
        e.preventDefault()
        e.stopPropagation()
        off(e)
      }
    }, true)
  }
}

function matchEvent(keyCode, e){
  if (document.activeElement && document.activeElement.nodeName === 'TEXTAREA'){
    return false
  }
  return Array.isArray(keyCode) && ~keyCode.indexOf(e.keyCode) || keyCode == e.keyCode
}