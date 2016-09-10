var computed = require('@mmckegg/mutant/computed')
module.exports = ParamNegate

function ParamNegate (input) {
  return computed([input.currentValue || input], negate, {
    comparer: eq
  })
}

function negate (value) {
  if (value instanceof global.AudioNode) {
    var gain = value.context.createGain()
    gain.gain.value = -1
    value.connect(gain)
    return gain
  } else {
    return -value
  }
}

function eq (a, b) {
  return a === b
}
