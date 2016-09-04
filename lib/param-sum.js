var computed = require('@mmckegg/mutant/computed')
module.exports = ParamSum

function ParamSum (params) {
  params = params.map(x => x && x.currentValue || x)
  return computed(params, lambda)
}

function lambda (...params) {
  var audioNode = params.find(p => p instanceof global.AudioNode)
  if (audioNode) {
    return sum(params, audioNode)
  } else {
    return params.reduce((result, value) => result + (value || 0), 0)
  }
}

function sum (params, baseParam) {
  var context = baseParam.context
  var sum = context.createGain()
  var numberValue = 0

  params.forEach(function (param) {
    if (param instanceof global.AudioNode) {
      param.connect(sum)
    } else if (typeof param === 'number') {
      numberValue += param
    }
  })

  if (numberValue) {
    var numberParam = context.createWaveShaper()
    numberParam.curve = new Float32Array([numberValue, numberValue])
    baseParam.connect(numberParam)
  }

  return sum
}
