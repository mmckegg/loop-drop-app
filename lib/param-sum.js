var computed = require('mutant/computed')
var Connector = require('lib/connector')
var ParamTransform = require('lib/param-transform')
var ParamFromNumber = require('lib/param-from-number')
var ValueAtTimeGetter = require('lib/value-at-time-getter')

module.exports = ParamSum

function ParamSum (inputs) {
  return ParamTransform(inputs, sumParams, sumValues)
}

function sumParams (audioContext, params, number) {
  var connections = new Connector()
  var getValueAtTime = ValueAtTimeGetter(params, number, sumValues)

  return computed([params, ParamFromNumber(audioContext, number)], function (params, numberParam) {
    connections.clear()

    var result = audioContext.createGain()

    for (var i = 0; i < params.length; i++) {
      connections.add(params[i], result)
    }

    if (numberParam) {
      connections.add(numberParam, result)
    }

    result.getValueAtTime = getValueAtTime
    return result
  }, {
    onListen: () => connections.connect(),
    onUnlisten: () => connections.disconnect()
  })
}

function sumValues (values) {
  return values.reduce((a, b) => a + b, 0)
}
