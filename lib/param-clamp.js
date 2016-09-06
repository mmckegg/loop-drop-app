var computed = require('@mmckegg/mutant/computed')

module.exports = ParamClamp

function ParamClamp (param, min, max) {
  return computed([param.currentValue || param, min, max], getClampedParam)
}

function getClampedParam (param, min, max) {
  if (param instanceof global.AudioNode) {
    var range = max - min
    var shaper = param.context.createWaveShaper()
    shaper.curve = new Float32Array([min, max])
    scale(param, 2 / range, -min - (range / 2)).connect(shaper)
    return shaper
  } else if (typeof param === 'number') {
    return Math.max(min, Math.min(max, param))
  }
}

function scale (param, multiplier, offset) {
  var sum = param.context.createGain()
  var offsetParam = getValue(offset, param)
  offsetParam.connect(sum)
  param.connect(sum)
  sum.gain.value = multiplier
  return sum
}

function getValue (value, param) {
  var result = param.context.createWaveShaper()
  result.curve = new Float32Array([value, value])
  param.connect(result)
  return result
}
