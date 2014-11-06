var gainToDecibels = require('./gain-to-decibels')
var decibelsToGain = require('./decibels-to-gain')

var frac = require('frac')
var beatValues = [1/16, 1/12, 1/8, 1/6, 1/4, 1/3, 3/8, 2/3, 3/4, 1, 2, 3, 4]

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
      return getRatio(value, decibelsToGain(-20), decibelsToGain(20), 'db')
    },
    value: function(offset, start){
      return getValueFromScreen(offset, start, decibelsToGain(-20), decibelsToGain(20), 'db')
    },
    display: function(value){
      return String(gainToDecibels(value)).replace(/Infinity/, "\u221e") + ' dB'
    }
  },

  'offset': {
    size: function(value){
      if (value > 0){
        return 0.5 + getRatio(value, 0, 10000, 'log+') / 2
      } else if (value < 0){
        return 0.5 - getRatio(-value, 0, 10000, 'log+') / 2
      } else {
        return 0.5
      }
    },
    value: function(offset, start){
      var ratio = module.exports.offset.size(start) + offset
      if (ratio > 0.5){
        return round(Math.max(0, getValueFromScreen((ratio - 0.5) * 2, 0, 0, 10000, 'log+')), 3)
      } else if (ratio < 0.5){
        return round(-Math.max(0, getValueFromScreen((0.5 - ratio) * 2, 0, 0, 10000, 'log+')), 3)
      } else {
        return 0
      }
    },
    display: function(value){
      if (value > 0){
        return '+' + String(round(value, 2))
      } else {
        return String(round(value, 2))
      }
    }
  },

  'sampleRatio': {
    size: function(value){
      return getRatio(value, 0, 1)
    },
    value: function(offset, start){
      if (!start){
        start = 11000
      }
      return getValueFromScreen(offset, start, 0, 1)
    },
    display: function(value){
      value = value * 48000
      if (value > 1000){
        return round(value/1000, 2) + ' kHz'
      } else {
        return round(value) + ' hz'
      }
    }
  },

  'bit': {
    size: function(value){
      return getRatio(value, 1, 8)
    },
    value: function(offset, start){
      return Math.max(1, Math.round(getValueFromScreen(offset, start, 1, 8)))
    },
    display: function(value){
      return String(value)
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
      if (value > 1000){
        return round(value/1000, 2) + ' kHz'
      } else {
        return round(value) + ' hz'
      }
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

  'semitoneUp': {
    size: function(value){
      return getRatio(value, -24, 60)
    },
    value: function(offset, start){
      return Math.round(getValueFromScreen(offset, start, -24, 60))
    },
    display: function(value){
      if (value > 0){
        return '+' + String(round(value, 2))
      } else {
        return String(round(value, 2))
      }
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

  'ratio100': {
    size: function(value){
      return getRatio(value, 0, 100, 'log+')
    },
    value: function(offset, start){
      return Math.max(0, getValueFromScreen(offset, start, 0, 100, 'log+'))
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
      if (value >= 1){
        return round(value,1) + ' s'
      } else {
        return round(value*1000) + ' ms'
      }
    }
  },

  'beat': {
    size: function(value){
      for (var i=0;i<beatValues.length;i++){
        if (beatValues[i]>value) break
      }
      return getRatio(i, 0, beatValues.length)
    },
    value: function(offset, start){
      for (var i=0;i<beatValues.length;i++){
        if (beatValues[i] >= start) break
      }

      var val = Math.round(getValueFromScreen(offset, i, 0, beatValues.length))
      val = Math.min(Math.max(val, 0), beatValues.length)
      return beatValues[val]
    },
    display: function(value){
      if (value >= 1){
        return round(value,1)
      } else {
        var f = frac(value, 32)
        return f[1] + '/' + f[2]
      }
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
    min = gainToDecibels(min)
    max = gainToDecibels(max)
    value = gainToDecibels(value)
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
    min = Math.max(-40, gainToDecibels(min))
    max = gainToDecibels(max)
    start = Math.max(-40, gainToDecibels(start))
  }

  start = start - min

  var range = max - min
  var value = start + (range * offset)

  if (curve === 'log'){
    value = Math.pow(10, value + min) / mag
  } else if (curve === 'log+'){
    value = (Math.pow(10, value + min) - 1) / mag
  } else if (curve === 'db'){
    value = decibelsToGain(value + min)
  } else {
    value += min
  }

  return value
}

function round(value, dp){
  var pow = Math.pow(10, dp || 0)
  return Math.round(value * pow) / pow
}