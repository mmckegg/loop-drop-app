var ObservStruct = require('@mmckegg/mutant/struct')
var Property = require('lib/property')

var Param = require('lib/param')
var ParamSource = require('lib/param-source')

module.exports = Envelope

function Envelope (context) {
  var obs = ObservStruct({
    attack: Param(context, 0),
    decay: Param(context, 0),
    release: Param(context, 0),
    sustain: Param(context, 1),
    retrigger: Property(false),
    value: Param(context, 1)
  })

  var outputParam = ParamSource(context, 0)
  obs.currentValue = outputParam// Multiply([obs.value, outputParam])
  obs.context = context

  obs.triggerOn = function (at) {
    at = Math.max(at, context.audio.currentTime)
    outputParam.cancelScheduledValues(at)

    if (obs.retrigger()) {
      outputParam.setValueAtTime(0, at)
    }

    Param.triggerOn(obs, at)

    var attackTime = getValue(obs.attack) || 0.001
    var decayTime = getValue(obs.decay) || 0.0001
    var peakTime = at + attackTime
    var value = getValue(obs.value)

    outputParam.setTargetAtTime(value, at, attackTime / 8)

    // decay / sustain
    var sustain = getValue(obs.sustain) * value
    if (sustain !== 1) {
      outputParam.setTargetAtTime(sustain, peakTime, decayTime / 8)
    }
  }

  obs.triggerOff = function (at) {
    at = Math.max(at, context.audio.currentTime)

    var releaseTime = getValue(obs.release) || 0.0001
    var stopAt = at + releaseTime

    Param.triggerOff(obs, stopAt)
    outputParam.cancelScheduledValues(at)
    outputParam.setTargetAtTime(0, at, releaseTime / 8)

    return stopAt
  }

  obs.getReleaseDuration = function () {
    return getValue(obs.release)
  }

  obs.destroy = function () {
    Param.destroy(obs)
  }

  return obs
}

function getValue (param) {
  if (param.currentValue) {
    var value = param.currentValue()
    if (typeof value === 'number') {
      return value
    } else {
      console.warn('Unable to automate envelope param.')
      return 0
    }
  }
}
