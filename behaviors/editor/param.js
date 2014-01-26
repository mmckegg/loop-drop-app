var query = require('micro-css').query

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

function round(value, dp){
  var pow = Math.pow(10, dp || 0)
  return Math.round(value * pow) / pow
}

function getRatio(value, min, max, curve, mag){

  mag = mag || 1
  
  if (curve === 'log'){
    min = Math.log(min)/Math.log(10)
    max = Math.log(max)/Math.log(10)
    value = Math.log(value)/Math.log(10)
  } else if (curve === 'log+'){
    min = Math.log(min*mag+1)/Math.log(10)
    max = Math.log(max*mag+1)/Math.log(10)
    value = Math.log(value*mag+1)/Math.log(10)
  } else if (curve === 'db'){
    min = getDecibels(min)
    max = getDecibels(max)
    value = getDecibels(value)
  }

  value = value - min

  var range = max - min
  return value / range
}

function getValueFromScreen(offset, start, min, max, curve, mag){
  mag = mag || 1

  if (curve === 'log'){
    min = Math.log(min)/Math.log(10)
    max = Math.log(max)/Math.log(10)
    start = Math.log(start)/Math.log(10)
  } else if (curve === 'log+'){
    min = Math.log(min*mag+1)/Math.log(10)
    max = Math.log(max*mag+1)/Math.log(10)
    start = Math.log(start*mag+1)/Math.log(10)
  } else if (curve === 'db'){
    min = getDecibels(min)
    max = getDecibels(max)
    start = getDecibels(start)
  }

  start = start - min

  var range = max - min
  var value = start + (range * offset)

  if (curve === 'log'){
    value = Math.pow(10, value + min)
  } else if (curve === 'log+'){
    value = (Math.pow(10, value + min) - 1) / mag
  } else if (curve === 'db'){
    value = getGain(value + min)
  } else {
    value += min
  }

  return value
}

function getGain(value) {
  if (value <= -40){
    return 0
  }
  return Math.round(Math.exp(value / 8.6858) * 10000) / 10000
}

function getDecibels(value) {
  if (value == null) return 0
  return Math.round(Math.round(20 * (0.43429 * Math.log(value)) * 100) / 100 * 10) / 10
}

var formatters = {
  'default': {
    size: function(value){
      return getRatio(value, 0, 100)
    },
    value: function(offset, start){
      return getValueFromScreen(offset, start, 0, 100)
    },
    display: function(value){
      return String(round(value, 2))
    }
  },

  'dB': {
    size: function(value){
      return getRatio(value, getGain(-20), getGain(20), 'db')
    },
    value: function(offset, start){
      return getValueFromScreen(offset, start, getGain(-20), getGain(20), 'db')
    },
    display: function(value){
      return window.context.editor.get(':dB(unit)', value)
    }
  },

  'arfo': {
    size: function(value){
      return getRatio(value, 20, 20000, 'log')
    },
    value: function(offset, start){
      return getValueFromScreen(offset, start, 20, 20000, 'log')
    },
    display: function(value){
      return window.context.editor.get(':hz(unit)', value)
    }
  },

  'lfo': {
    size: function(value){
      return getRatio(value, 0, 30)
    },
    value: function(offset, start){
      return getValueFromScreen(offset, start, 0, 30)
    },
    display: function(value){
      return Math.round(value*10)/10 + ' Hz'
    }
  },

  'semitone': {
    size: function(value){
      return getRatio(value, -48, 48)
    },
    value: function(offset, start){
      return Math.round(getValueFromScreen(offset, start, -48, 48))
    },
    display: function(value){
      if (value > 0){
        return '+' + String(round(value, 2))
      } else {
        return String(round(value, 2))
      }
    }
  },

  'ratio': {
    size: function(value){
      return getRatio(value, 0, 2)
    },
    value: function(offset, start){
      return getValueFromScreen(offset, start, 0, 2)
    },
    display: function(value){
      return String(round(value, 2))
    }
  },

  'bigRatio': {
    size: function(value){
      return getRatio(value, 0, 10000, 'log+')
    },
    value: function(offset, start){
      return Math.max(0, getValueFromScreen(offset, start, 0, 10000, 'log+'))
    },
    display: function(value){
      return String(round(value, 2))
    }
  },

  'ms': {
    size: function(value){
      return getRatio(value, 0, 1, 'log+', 100)
    },
    value: function(offset, start){
      return Math.max(0, getValueFromScreen(offset, start, 0, 1, 'log+'), 100)
    },
    display: function(value){
      return window.context.editor.get(':ms(unit)', value)
    }
  }
}