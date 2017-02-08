var computed = require('mutant/computed')
var ParamTransform = require('lib/param-transform')
var ParamSource = require('lib/param-source')
module.exports = ParamNegate

function ParamNegate (input) {
  return computed([input.currentValue || input], negate, {
    comparer: ParamTransform.deepEqual
  })
}

function negate (value) {
  if (value instanceof global.AudioNode) {
    var gain = value.context.createGain()
    gain.gain.value = -1
    value.connect(gain)
    return gain
  } else if (ParamSource.isParam(value)) {
    // lazy params
    ParamSource.reduce([value], (values) => -values[0])
  } else {
    return -value
  }
}
