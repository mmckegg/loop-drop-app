var ObservStruct = require('@mmckegg/mutant/struct')
var computed = require('@mmckegg/mutant/computed')
var Property = require('observ-default')
var Param = require('lib/param')
var applyScale = require('lib/apply-scale')

module.exports = ScaleModulator

var defaultScale = {
  offset: 0,
  notes: [0, 2, 4, 5, 7, 9, 11]
}

function ScaleModulator (context) {
  var obs = ObservStruct({
    value: Param(context, 0),
    scale: Property(defaultScale)
  })

  obs.currentValue = computed([obs.value.currentValue, context.offset.currentValue || context.offset, obs.scale], lambda)
  return obs
}

function lambda (input, offset, scale) {
  if (input instanceof global.AudioNode || offset instanceof global.AudioNode) {
    var params = getParams(input, offset)
    return paramApplyScale(add(params[0], params[1]), scale)
  } else if (typeof input === 'number') {
    return applyScale(input + offset, scale)
  }
}

function paramApplyScale (param, scale) {
  var curve = new Float32Array(129)
  for (var i = 0; i < 129; i++) {
    curve[i] = applyScale(i - 64, scale)
  }
  var shaper = param.context.createWaveShaper()
  shaper.curve = curve
  multiply(param, 1 / 64).connect(shaper)
  return shaper
}

function multiply (param, multiplier) {
  var sum = param.context.createGain()
  param.connect(sum)
  param.gain.value = multiplier
  return sum
}

function add (a, b) {
  var sum = a.context.createGain()
  a.connect(sum)
  b.connect(sum)
  return sum
}

function getParams (a, b) {
  if (a instanceof global.AudioNode && b instanceof global.AudioNode) {
    return [ a, b ]
  } else if (a instanceof global.AudioNode) {
    var bParam = a.context.createWaveShaper()
    bParam.curve = new Float32Array([b, b])
    a.connect(bParam)
    return [ a, bParam ]
  } else {
    var aParam = b.context.createWaveShaper()
    aParam.curve = new Float32Array([a, a])
    b.connect(aParam)
    return [ aParam, b ]
  }
}
