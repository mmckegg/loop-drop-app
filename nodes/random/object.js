var ParamSource = require('lib/param-source')
var Multiply = require('lib/param-multiply')
var Param = require('lib/param')
var Property = require('lib/property')
var ObservStruct = require('mutant/struct')
var computed = require('mutant/computed')
var resolve = require('mutant/resolve')
var Sum = require('lib/param-sum')
var Negate = require('lib/param-negate')

module.exports = RandomModulator

function RandomModulator (context) {
  var obs = ObservStruct({
    mode: Property('add'),
    interpolate: Property('linear'),
    amp: Param(context, 1),
    value: Param(context, 0)
  })

  obs.context = context

  var outputValue = ParamSource(context, 0)

  obs.currentValue = computed([obs.mode], function (mode) {
    var result = null
    result = Multiply([outputValue, obs.amp])
    if (mode === 'multiply') {
      result = Multiply([result, obs.value])
    } else if (mode === 'add') {
      result = Sum([result, obs.value])
    } else if (mode === 'subtract') {
      result = Sum([result, Negate(obs.value)])
    }

    return result
  })

  obs.triggerOn = function (at) {
    var value = Math.random()
    if (resolve(obs.interpolate) === 'exp') {
      value = value * value
    }

    outputValue.setValueAtTime(value, at)
    Param.triggerOn(obs, at)
  }

  obs.triggerOff = function (at) {
    Param.triggerOff(obs, at)
  }

  return obs
}
