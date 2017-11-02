var computed = require('mutant/computed')
var ParamTransform = require('lib/param-transform')
var ParamSource = require('lib/param-source')

module.exports = ParamSquare

function ParamSquare (input) {
  return computed([input.currentValue || input], lambda, {
    comparer: ParamTransform.deepEqual
  })
}

function lambda (value) {
  if (value instanceof global.AudioNode) {
    return paramApplySquare(value)
  } else if (ParamSource.isParam(value)) {
    // lazy params
    return ParamSource.reduce([value], (values) => square(values[0]))
  } else {
    return square(value)
  }
}

function square (value) {
  return value * value
}

function paramApplySquare (param) {
  var output = param.context.createGain()
  param.connect(output)
  param.connect(output.gain)
  return output
}
