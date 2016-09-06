var ObservStruct = require('@mmckegg/mutant/struct')
var Property = require('observ-default')

var Param = require('lib/param')
var Multiply = require('lib/param-multiply')

var createVoltage = require('lib/create-voltage')

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

  var outputParam = context.audio.createGain()
  obs.currentValue = Multiply([obs.value, outputParam])
  obs.context = context

  var currentPlayer = null
  var currentAmp = null
  var triggeredTo = 0

  obs.triggerOn = function (at) {
    at = Math.max(at, context.audio.currentTime)

    if (obs.retrigger() || triggeredTo < at) {
      obs.choke(at)
      currentPlayer = createVoltage(context.audio)
      currentAmp = context.audio.createGain()
      currentAmp.gain.value = 0
      currentPlayer.connect(currentAmp).connect(outputParam)
      currentPlayer.start(at)
      triggeredTo = Infinity
    } else {
      currentAmp.gain.cancelScheduledValues(at)
      currentPlayer.stop(at + 1000) // HACK: cancel stop
      triggeredTo = at + 1000
    }

    Param.triggerOn(obs, at)

    var peakTime = at + (obs.attack() || 0.005)

    if (obs.attack()) {
      currentAmp.gain.setTargetAtTime(1, at, getValue(obs.attack) / 8)
    } else {
      currentAmp.gain.setValueAtTime(1, at)
    }

    // decay / sustain
    var sustain = getValue(obs.sustain)
    if (sustain !== 1) {
      currentAmp.gain.setTargetAtTime(getValue(obs.sustain), peakTime, getValue(obs.decay) / 8 || 0.0001)
    }
  }

  obs.triggerOff = function (at) {
    at = Math.max(at, context.audio.currentTime)
    var releaseTime = getValue(obs.release)
    var stopAt = at + releaseTime

    if (at < triggeredTo) {
      currentPlayer.stop(stopAt)
      triggeredTo = stopAt

      Param.triggerOff(obs, stopAt)

      if (releaseTime) {
        currentAmp.gain.setTargetAtTime(0, at, releaseTime / 8)
      }
    }

    return stopAt
  }

  obs.choke = function (at) {
    if (at < triggeredTo) {
      var attack = getValue(obs.attack)
      if (attack > 0.1) {
        currentPlayer.stop(at + 0.1)
        triggeredTo = at + 0.1
        currentAmp.gain.cancelScheduledValues(at)
        currentAmp.gain.setTargetAtTime(0, at, 0.02)
        currentAmp.gain.setValueAtTime(0, at + 0.1)
      } else {
        currentPlayer.stop(at)
        triggeredTo = at
        return true
      }
    }
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
