var paramFormatters = require('../../lib/param_formatters')

module.exports = function(container){

  var formatter = paramFormatters['bpm']

  var slider = container.querySelector('div')
  var label = container.querySelector('span.\\.label')

  window.context.clock.on('tempo', refresh)


  function refresh(){
    var value = window.context.clock.getTempo()
    slider.style.width = Math.min(1, formatter.size(value)) * 100 + '%'
    label.innerText = formatter.display(value)
  }

  container.addEventListener('mousedown', handleDown)

  function handleDown(e){
    range = container.getBoundingClientRect().width
    startValue = window.context.clock.getTempo()
    lastValue = startValue
    startCoords = [e.screenX, e.screenY]

    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleUp)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  function handleUp(e){
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleUp)
  }

  function handleMove(e){
    var offsetY = Math.abs(e.screenY - startCoords[1])
    var offsetX = (e.screenX - startCoords[0]) / (range + offsetY)
    var value = formatter.value(offsetX, startValue)
    if (value != lastValue && !isNaN(value)){
      setValue(value)
      lastValue = value
    }
  }

  function setValue(value){
    window.context.clock.setTempo(value)
  }

  refresh()

  return refresh
}