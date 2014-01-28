var query = require('micro-css').query
var formatters = require('../../lib/param_formatters')

module.exports = function(container){
  var slider = container.querySelector(query('div.slider')) || container
  var width = slider.querySelector('div')
  var label = slider.querySelector(query('span.label'))

  var tabs = {
    lfo: container.querySelector(query('a.lfo')),
    adsr: container.querySelector(query('a.adsr')),
    param: container.querySelector(query('a.param')),
    value: container.querySelector(query('a.clear'))
  }

  Object.keys(tabs).forEach(function(key){
    var tab = tabs[key]
    if (tab){
      tab.addEventListener('click', handleTab)
    }
  })

  function handleTab(e){
    if (this.dataset.type && this.dataset.type != 'value'){
      window.events.emit('updateActiveSlot', path, {
        $node: true,
        $valueTo: 'value',
        type: this.dataset.type
      })
    } else {
      window.events.emit('updateActiveSlot', path, {
        $node: false,
        $valueFrom: 'value'
      })
    }
  }

  var startCoords = null
  var startValue = null
  var lastValue = null
  var lastModifier = false

  var path = null
  var formatter = null
  var range = null

  function handleDown(e){
    range = slider.getBoundingClientRect().width
    startValue = window.context.editor.get(container.dataset.path)
    if (startValue && !Array.isArray(startValue) && startValue instanceof Object){
      startValue = startValue.value
    }

    if (startValue == null && container.dataset['default']){
      startValue = parseFloat(container.dataset['default'])
    }

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
    window.events.emit('updateActiveSlot', path, {
      $node: 'match',
      value: value
    })
  }

  slider.addEventListener('mousedown', handleDown)

  function refresh(action){

    if (action !== 'remove'){

      path = container.dataset.path
      formatter = formatters[container.dataset.f] || formatters['default']

      var value = window.context.editor.get(path)
      var object = null

      if (value && !Array.isArray(value) && value instanceof Object){
        object = value
        value = value.value
      }

      if (value == null && container.dataset['default']){
        value = parseFloat(container.dataset['default'])
      }

      var modifier = object && object.type

      if (lastModifier != modifier){
        Object.keys(tabs).forEach(function(key){
          if (tabs[key]){
            if (key == modifier){
              tabs[key].classList.add('-selected')
            } else {
              tabs[key].classList.remove('-selected')
            }
          }
        })
        lastModifier = modifier
      }

      label.innerText = formatter.display(value)
      width.style.width = getWidth(formatter.size(value))
    }


  }

  refresh()

  return refresh
}

function getWidth(size){
  return Math.min(1, Math.max(0, size)) * 100 + '%'
}