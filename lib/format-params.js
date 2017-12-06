var gainToDecibels = require('decibels/from-gain')
var decibelsToGain = require('decibels/to-gain')
var clamp = require('lib/clamp')

var frac = require('frac')
var beatValues = [1/16, 1/12, 1/8, 1/6, 1/4, 1/3, 3/8, 1/2, 2/3, 3/4, 1, 2, 3, 4, 6, 8]

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

  'midi': {
    size: function(value){
      return getRatio(value, 0, 127)
    },
    value: function(offset, start){
      return clamp(Math.round(getValueFromScreen(offset, start, 0, 127)), 0, 127)
    },
    display: function(value){
      return String(value)
    }
  },

  'midi+1': {
    size: function(value){
      return getRatio(value, 0, 127)
    },
    value: function(offset, start){
      return clamp(Math.round(getValueFromScreen(offset, start, 0, 127)), 0, 127)
    },
    display: function(value){
      return String(value + 1)
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
      return String(round(gainToDecibels(value), 1)).replace(/Infinity/, "\u221e") + ' dB'
    }
  },

  'dBn': {
    size: function(value){
      return getRatio(value, -50, 20)
    },
    value: function(offset, start){
      return getValueFromScreen(offset, start, -50, 20)
    },
    display: function(value){
      return String(round(value, 1)).replace(/Infinity/, "\u221e") + ' dB'
    }
  },

  'pan': {
    size: function (value) {
      return getRatio(value, -1, 1)
    },
    value: function (offset, start) {
      return Math.min(1, Math.max(-1, round(getValueFromScreen(offset, start, -1, 1), 2)))
    },
    display: function (value) {
      if (value === 0) {
        return 'C'
      } else if (value > 0) {
        return String(round(value * 50, 0)) + 'R'
      } else {
        return String(round(Math.abs(value * 50), 0) + 'L')
      }
    }
  },

  'offset1': {
    size: function(value){
      return getRatio(value, -1, 1)
    },
    value: function(offset, start){
      return Math.min(1, Math.max(-1, round(getValueFromScreen(offset, start, -1, 1), 2)))
    },
    display: function(value){
      if (value > 0){
        return '+' + String(round(value, 2))
      } else {
        return String(round(value, 2))
      }
    }
  },

  'syncMs': {
    size: function (value) {
      return getRatio(value, -40, 40)
    },
    value: function (offset, start) {
      return Math.max(-40, round(getValueFromScreen(offset, start, -40, 40), 0))
    },
    display: function (value) {
      if (value > 0) {
        return '+' + String(round(value, 0)) + ' ms'
      } else {
        return String(round(value, 0)) + ' ms'
      }
    }
  },

  'offset': {
    size: function(value){
      if (value > 0){
        return 0.5 + getRatio(value, 0, 20, 'log+', 20) / 2
      } else if (value < 0){
        return 0.5 - getRatio(-value, 0, 20, 'log+', 20) / 2
      } else {
        return 0.5
      }
    },
    value: function(offset, start){
      var ratio = module.exports.offset.size(start) + offset

      var value = ratio > 0.5 ?
        Math.max(0, getValueFromScreen((ratio - 0.5) * 2, 0, 0, 20, 'log+', 20)) :
        (ratio < 0.5) ? -Math.max(0, getValueFromScreen((0.5 - ratio) * 2, 0, 0, 20, 'log+', 20)) : 0

      if (Math.abs(value) > 100){
        return Math.round(value / 10) * 10
      } else if (Math.abs(value) > 1){
        return round(value)
      } else {
        return round(value, 2)
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
      return module.exports.arfo.size(value * 48000)
    },
    value: function(offset, start){
      return module.exports.arfo.value(offset, start * 48000) / 48000
    },
    display: function(value){
      return module.exports.arfo.display(value * 48000)
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

      var value = getValueFromScreen(offset, start, 20, 20000, 'log')

      if (value < 100){
        return Math.round(value)
      } else if (value < 1000) {
        return Math.round(value / 5) * 5
      } else if (value < 10000) {
        return Math.round(value / 100) * 100
      } else {
        return Math.round(value / 1000) * 1000
      }
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
      return getRatio(value, 1/24, 24, 'exp', 2)
    },
    value: function(offset, start){
      var value = Math.max(1/24, getValueFromScreen(offset, start, 0, 24, 'exp', 2))
      return value < 1 ?
        Math.round(value*24)/24 :
        value < 2 ?
          Math.round(value*6)/6 :
          Math.round(value)
    },
    display: function(value){
      if (value < 1){
        var f = frac(value, 24)
        return f[1] + '/' + f[2]
      } else {
        return round(value, 2) + ' Hz'
      }
    }
  },

  'beats': {
    size: function(value){
      return getRatio(value, 1/24, 24, 'exp', 2)
    },
    value: function(offset, start){
      var value = Math.max(1/24, getValueFromScreen(offset, start, 0, 24, 'exp', 2))
      return value < 1 ?
        Math.round(value*24)/24 :
        value < 2 ?
          Math.round(value*6)/6 :
          Math.round(value)
    },
    display: function(value){
      if (value < 1){
        var f = frac(value, 24)
        return f[1] + '/' + f[2]
      } else {
        return String(round(value, 2))
      }
    }
  },

  'beats2': {
    size: function(value){
      return getRatio(value, 0, 32, 'exp')
    },
    value: function(offset, start){
      var value = Math.max(1/24, getValueFromScreen(offset, start, 0, 32, 'exp'))
      return Math.round(value*12)/12
    },
    display: function(value){
      if (value < 1){
        var f = frac(value, 24)
        return f[1] + '/' + f[2]
      } else {
        return String(round(value, 2))
      }
    }
  },

  'cents': {
    size: function(value){
      return getRatio(value, -100, 100)
    },
    value: function(offset, start){
      return Math.round(getValueFromScreen(offset, start, -100, 100))
    },
    display: function(value){
      if (value > 0){
        return '+' + String(round(value, 2))
      } else {
        return String(round(value, 2))
      }
    }
  },

  'cents+': {
    size: function(value){
      return getRatio(value, -600, 600)
    },
    value: function(offset, start){
      return Math.round(getValueFromScreen(offset, start, -600, 600))
    },
    display: function(value){
      if (value > 0){
        return '+' + String(round(value, 2))
      } else {
        return String(round(value, 2))
      }
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

  'beatOffset': {
    size: function(value){
      return getRatio(value, 0, 32)
    },
    value: function(offset, start){
      return Math.round(getValueFromScreen(offset, start, 0, 32))
    },
    display: function(value){
      return String(Math.round(value))
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

  'octave': {
    size: function(value){
      return getRatio(value, -6, 6)
    },
    value: function(offset, start){
      return Math.round(getValueFromScreen(offset, start, -6, 6))
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
      return getRatio(value, 0, 2, 'exp')
    },
    value: function(offset, start){
      return Math.max(0, getValueFromScreen(offset, start, 0, 2, 'exp'))
    },
    display: function(value){
      if (value < 1.1){
        return String(round(value, 3))
      } else {
        return String(round(value, 2))
      }
    }
  },

  'ratio1': {
    size: function(value){
      return getRatio(value, 0, 1)
    },
    value: function(offset, start){
      return Math.min(Math.max(0, getValueFromScreen(offset, start, 0, 1)), 1)
    },
    display: function(value){
      return String(round(value, 2))
    }
  },

  'ratioExp': {
    size: function(value){
      return getRatio(value, 0, 32, 'exp', 2)
    },
    value: function(offset, start){
      return Math.max(0, round(getValueFromScreen(offset, start, 0, 32, 'exp', 3), 2))
    },
    display: function(value){
      return String(round(value, 2))
    }
  },

  'ratio1Log': {
    size: function(value){
      return 1-getRatio(1-value, 0.0001, 1, 'log+', 100)
    },
    value: function(offset, start){
      return Math.max(0, 1-getValueFromScreen(-offset, 1-start, 0.0001, 1, 'log+', 100))
    },
    display: function(value){
      return String(round(value, 3))
    }
  },

  'compressionRatio': {
    size: function(value){
      return getRatio(value, 1, 20)
    },
    value: function(offset, start){
      return Math.max(1, Math.round(getValueFromScreen(offset, start, 1, 20)))
    },
    display: function(value){
      return String(round(value, 1))
    }
  },

  'ratio32': {
    size: function(value){
      return getRatio(value, 0, 32)
    },
    value: function(offset, start){
      return Math.max(0, Math.round(getValueFromScreen(offset, start, 0, 32)))
    },
    display: function(value){
      return String(round(value, 0))
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
      return getRatio(value, 0, 30, 'log+', 20)
    },
    value: function(offset, start){
      var value = Math.max(0, getValueFromScreen(offset, start, 0, 30, 'log+', 20))
      if (value < 1){
        return round(value, 3)
      } else {
        return round(value, 1)
      }
    },
    display: function(value){
      if (value >= 1){
        return round(value,1) + ' s'
      } else {
        return round(value*1000) + ' ms'
      }
    }
  },

  'ms1': {
    size: function(value){
      return getRatio(value, 0, 1, 'log+', 20)
    },
    value: function(offset, start){
      var value = Math.max(0, getValueFromScreen(offset, start, 0, 1, 'log+', 20))
      if (value < 1){
        return round(value, 3)
      } else {
        return round(value, 1)
      }
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
        return String(round(value,1))
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
  } else if (curve === 'exp'){
    min = Math.pow(min, 1/(2*mag))
    max = Math.pow(max, 1/(2*mag))
    value = Math.pow(value, 1/(2*mag))
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
  } else if (curve === 'exp'){
    min = Math.pow(min, 1/(2*mag))
    max = Math.pow(max, 1/(2*mag))
    start = Math.pow(start, 1/(2*mag))
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
  } else if (curve === 'exp'){
    value = Math.pow(value, 2*mag)
  } else {
    value += min
  }

  return value
}

function round(value, dp){
  var pow = Math.pow(10, dp || 0)
  return Math.round(value * pow) / pow
}
