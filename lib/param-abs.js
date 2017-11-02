var computed = require('mutant/computed')
var ParamTransform = require('lib/param-transform')
var ParamSource = require('lib/param-source')
var absCurve = new Float32Array([1, 0, 1])

module.exports = ParamSquare

function ParamSquare (input) {
  return computed([input.currentValue || input], lambda, {
    comparer: ParamTransform.deepEqual
  })
}

function lambda (value) {
  if (value instanceof global.AudioNode) {
    return paramApplyAbs(value)
  } else if (ParamSource.isParam(value)) {
    // lazy params
    return ParamSource.reduce([value], (values) => abs(values[0]))
  } else {
    return abs(value)
  }
}

function abs (value) {
  return Math.abs(value)
}

function paramApplyAbs (param) {
  // TODO: this should probably handle values greater than 1, right now clips
  var output = param.context.createWaveShaper()
  output.curve = absCurve
  param.connect(output)
  return output
}
