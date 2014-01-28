module.exports = {
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
      if (!start){
        start = 20
      }
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
      return Math.max(0, getValueFromScreen(offset, start, 0, 2))
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
      return Math.max(0, getValueFromScreen(offset, start, 0, 1, 'log+', 100))
    },
    display: function(value){
      return window.context.editor.get(':ms(unit)', value)
    }
  },

  'bpm': {
    size: function(value){
      return round(getRatio(value, 50, 180), 2)
    },
    value: function(offset, start){
      return Math.max(0, round(getValueFromScreen(offset, start, 50, 180)))
    },
    display: function(value){
      return round(value, 2) + ' bpm'
    }
  }
}

function getRatio(value, min, max, curve, mag){

  mag = mag || 1
  
  if (curve === 'log'){
    min = Math.log(min*mag)/Math.log(10)
    max = Math.log(max*mag)/Math.log(10)
    value = Math.log(value*mag)/Math.log(10)
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
    min = Math.log(min*mag)/Math.log(10)
    max = Math.log(max*mag)/Math.log(10)
    start = Math.log(start*mag)/Math.log(10)
  } else if (curve === 'log+'){
    min = Math.log(min*mag+1)/Math.log(10)
    max = Math.log(max*mag+1)/Math.log(10)
    start = Math.log(start*mag+1)/Math.log(10)
  } else if (curve === 'db'){
    min = Math.max(-40, getDecibels(min))
    max = getDecibels(max)
    start = Math.max(-40, getDecibels(start))
  }

  start = start - min

  var range = max - min
  var value = start + (range * offset)

  if (curve === 'log'){
    value = Math.pow(10, value + min) / mag
  } else if (curve === 'log+'){
    value = (Math.pow(10, value + min) - 1) / mag
  } else if (curve === 'db'){
    value = getGain(value + min)
  } else {
    value += min
  }

  return value
}

function round(value, dp){
  var pow = Math.pow(10, dp || 0)
  return Math.round(value * pow) / pow
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