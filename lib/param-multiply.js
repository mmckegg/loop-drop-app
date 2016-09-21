var computed = require('@mmckegg/mutant/computed')
var Connector = require('lib/connector')
var ParamTransform = require('lib/param-transform')

module.exports = ParamMultiply

function ParamMultiply (inputs) {
  return ParamTransform(inputs, multiplyParams, multiplyValues)
}

function multiplyParams (audioContext, params, number) {
  var connections = new Connector(audioContext)
  var last = null

  return computed(params, function (params) {
    connections.clear()

    var result = null
    last = null

    for (var i = 0; i < params.length; i++) {
      var wrapper = audioContext.createGain()
      connections.add(params[i], wrapper)

      if (last) {
        connections.add(wrapper, last.gain)
      } else {
        result = wrapper
      }

      last = wrapper
    }

    if (number != null) {
      connections.addParam(number, last.gain)
    }

    return result
  }, {
    comparer: ParamTransform.deepEqual,
    onListen: () => connections.connect(),
    onUnlisten: () => connections.disconnect()
  })
}

function multiplyValues (values) {
  return values.reduce((a, b) => a * b, 1)
}
