var computed = require('@mmckegg/mutant/computed')
var ParamTransform = require('lib/param-transform')
var ParamSource = require('lib/param-source')
module.exports = ParamQuantize

function ParamQuantize (input, grid) {
  return computed([input.currentValue || input, grid], lambda, {
    comparer: ParamTransform.deepEqual
  })
}

function lambda (value, grid) {
  if (value instanceof global.AudioNode) {
    return paramApplyQuantize(value, grid)
  } else if (ParamSource.isParam(value)) {
    // lazy params
    return ParamSource.reduce([value], (values) => quantize(values[0], grid))
  } else {
    return quantize(value, grid)
  }
}

function quantize (value, grid) {
  if (grid) {
    return Math.round(value * grid) / grid
  } else {
    return value
  }
}

function paramApplyQuantize (param, grid) {
  if (grid) {
    var res = 16
    var steps = 256 + 1 // center
    var start = -128 * grid
    var curve = new Float32Array(res * steps)
    for (var i = 0; i < steps; i++) {
      for (var x = 0; x < res; x++) {
        curve[i * res + x] = start + grid * i
      }
    }
    var shaper = param.context.createWaveShaper()
    shaper.curve = curve
    multiply(param, 1 / (128 * grid)).connect(shaper)
    return shaper
  } else {
    return param
  }
}

function multiply (param, multiplier) {
  var sum = param.context.createGain()
  sum.gain.value = multiplier
  param.connect(sum)
  return sum
}
