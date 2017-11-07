var ObservStruct = require('mutant/struct')
var Property = require('lib/property')

var Param = require('lib/param')
var ParamSource = require('lib/param-source')

module.exports = Envelope

function Envelope (context) {
  var obs = ObservStruct({
    id: Property(),
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
  obs.id.context = context

  obs.triggerOn = function (at) {
    at = Math.max(at, context.audio.currentTime)
    outputParam.cancelAndHoldAtTime(at)

    var startValue = obs.retrigger() ? 0 : outputParam.getValueAtTime(at)
    outputParam.setValueAtTime(startValue, at)

    Param.triggerOn(obs, at)

    var attackDuration = obs.attack.getValueAtTime(at) || 0.005
    var decayDuration = obs.decay.getValueAtTime(at) || 0.005
    var peakTime = at + attackDuration
    var value = obs.value.getValueAtTime(at)

    outputParam.linearRampToValueAtTime(value, peakTime)

    // decay / sustain
    var sustain = obs.sustain.getValueAtTime(at) * value
    if (sustain !== value) {
      outputParam.linearRampToValueAtTime(sustain, peakTime + decayDuration)
    }
  }

  obs.triggerOff = function (at) {
    at = Math.max(at, context.audio.currentTime)

    var releaseTime = obs.release.getValueAtTime(at) || 0.0001
    var stopAt = at + releaseTime

    Param.triggerOff(obs, stopAt)
    outputParam.cancelAndHoldAtTime(at)

    outputParam.setTargetAtTime(0, at, releaseTime / 8)

    // HACK: clean up hanging target
    outputParam.setValueAtTime(0, stopAt)

    return stopAt
  }

  obs.getAttackDuration = function () {
    return obs.attack.getValueAtTime(context.audio.currentTime) || 0.005
  }

  obs.getReleaseDuration = function () {
    return obs.release.getValueAtTime(context.audio.currentTime)
  }

  obs.destroy = function () {
    Param.destroy(obs)
  }

  return obs
}
