var computed = require('@mmckegg/mutant/computed')
module.exports = ParamTransform

var onesCurve = new Float32Array([1, 1])
var computedOptions = {
  immutableTypes: [global.AudioNode]
}

function ParamTransform (a, b, operation) {
  var params = normalizeParams(a, b)
  return computed([params[0], params[1], operation], lambda, { nextTick: true })
}

function normalizeParams (a, b) {
  var signal = null
  var param = null

  if (a && a.currentValue) {
    a = a.currentValue
  }

  if (b && b.currentValue) {
    b = b.currentValue
  }

  return [
    computed([a, b], func, computedOptions),
    computed([b, a], func, computedOptions)
  ]

  // scoped

  function func (a, b) {
    if (a instanceof global.AudioNode) {
      return a
    } else if (b instanceof global.AudioNode) {
      if (!param) {
        param = b.context.createGain()
        param.gain.value = 0.000000001
        signal = b.context.createWaveShaper()
        signal.curve = onesCurve
        signal.connect(param)
      }

      b.connect(signal)
      param.gain.value = a || 0.000000001 // HACK: setting gain value to 0 actually stops the signal from flowing
      return param
    } else {
      return a
    }
  }
}

function lambda (a, b, op) {
  if (a instanceof global.AudioNode) {
    return forAudioParam(a, b, op)
  } else if (typeof a === 'number') {
    if (isNaN(a) || isNaN(b)) {
      throw new Error('Values must be finite.')
    }
    return forValue(a, b, op)
  }
}

function forValue (a, b, op) {
  if (op === 'add') {
    return a + b
  } else if (op === 'subtract') {
    return a - b
  } else if (op === 'multiply') {
    return a * b
  } else if (op === 'divide') {
    return a / b
  }
}

function forAudioParam (a, b, op) {
  var context = a.context
  var sum = context.createGain()
  if (op === 'add' || op === 'subtract') {
    a.connect(sum)
    if (op === 'add') {
      b.connect(sum)
    } else {
      negate(b).connect(sum)
    }
  } else if (op === 'multiply') {
    sum.gain.value = 0
    a.connect(sum)
    b.connect(sum.gain)
  }
  return sum
}

function negate (param) {
  var gain = param.context.createGain()
  gain.gain.value = -1
  param.connect(gain)
  return gain
}
