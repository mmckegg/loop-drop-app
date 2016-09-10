var computed = require('@mmckegg/mutant/computed')
module.exports = ParamMultiply

var onesCurve = new Float32Array([1, 1])

function ParamMultiply (inputs) {
  return computed(inputs.map(getCurrentValue), lambda, {
    nextTick: true,
    context: {},
    comparer: eq
  })
}

function getCurrentValue (value) {
  return value.currentValue || value
}

function lambda (...inputs) {
  var params = inputs.filter(isAudioNode)
  var numbers = inputs.filter(isNumber)
  var numberResult = numbers.reduce(multiply, 1)
  if (params.length > 0) {
    var hasNumbers = numbers.length > 0
    var previousHasNumbers = this.numberResult != null

    if (this.result && deepEqual(params, this.inputs) && hasNumbers === previousHasNumbers) {
      if (hasNumbers) {
        this.numberResult.gain.value = numberResult || 0.0000000001 // HACK: setting gain value to 0 actually stops the signal from flowing
      }
      return computed.NO_CHANGE
    } else {
      this.numberResult = hasNumbers ? getParam(numberResult, params[0]) : null
      this.inputs = params.slice()
      this.result = multiplyParams(params, this.numberResult)
      return this.result
    }
  } else {
    return numberResult
  }
}

function getParam (value, baseParam) {
  var param = baseParam.context.createGain()
  param.gain.value = value || 0.0000000001
  var signal = baseParam.context.createWaveShaper()
  signal.curve = onesCurve
  baseParam.connect(signal).connect(param)
  return param
}

function multiplyParams (params, extraParam) {
  var audioContext = params[0].context
  var result = null
  var last = null
  for (var i = 0; i < params.length; i++) {
    var wrapped = audioContext.createGain()
    params[i].connect(wrapped)

    if (last) {
      last.gain.value = 0
      wrapped.connect(last.gain)
    } else {
      result = wrapped
    }

    last = result
  }

  if (extraParam) {
    last.gain.value = 0
    extraParam.connect(last.gain)
  }

  return result
}

function multiply (a, b) {
  return a * b
}

function isAudioNode (value) {
  return value instanceof global.AudioNode
}

function isNumber (value) {
  return typeof value === 'number'
}

function eq (a, b) {
  return a === b
}

function deepEqual (a, b) {
  if (a.length === b.length) {
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false
      }
    }
    return true
  } else {
    return false
  }
}
