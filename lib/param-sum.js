var computed = require('mutant/computed')
var Connector = require('lib/connector')
var ParamTransform = require('lib/param-transform')
var ParamFromNumber = require('lib/param-from-number')

module.exports = ParamSum

function ParamSum (inputs) {
  return ParamTransform(inputs, sumParams, sumValues)
}

function sumParams (audioContext, params, number) {
  var connections = new Connector()

  return computed([params, ParamFromNumber(audioContext, number)], function (params, numberParam) {
    connections.clear()

    var result = audioContext.createGain()

    for (var i = 0; i < params.length; i++) {
      connections.add(params[i], result)
    }

    if (numberParam) {
      connections.add(numberParam, result)
    }

    return result
  }, {
    onListen: () => connections.connect(),
    onUnlisten: () => connections.disconnect()
  })
}

function sumValues (values) {
  return values.reduce((a, b) => a + b, 0)
}
