var ObservStruct = require('@mmckegg/mutant/struct')
var Property = require('lib/property')

var Param = require('lib/param')
var Multiply = require('lib/param-multiply')

var createVoltage = require('lib/create-voltage')
var ScheduleEvent = require('lib/schedule-event')

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

  var lastEvent = null

  obs.triggerOn = function (at) {
    at = Math.max(at, context.audio.currentTime)

    if (obs.retrigger() || !lastEvent || (lastEvent.to && lastEvent.to < at)) {
      obs.choke(at)
      var player = createVoltage(context.audio)
      var amp = context.audio.createGain()
      var choker = context.audio.createGain()
      amp.gain.value = 0
      player.connect(amp).connect(choker).connect(outputParam)
      player.start(at)
      lastEvent = new ScheduleEvent(at, player, choker)
      lastEvent.amp = amp
      context.cleaner.push(lastEvent)
    } else {
      lastEvent.choker.gain.cancelScheduledValues(at)
      lastEvent.choker.gain.setValueAtTime(1, at)
      lastEvent.amp.gain.cancelScheduledValues(at)
      lastEvent.to = null
    }

    Param.triggerOn(obs, at)

    var peakTime = at + (obs.attack() || 0.005)

    if (obs.attack()) {
      lastEvent.amp.gain.setTargetAtTime(1, at, getValue(obs.attack) / 8)
    } else {
      lastEvent.amp.gain.setValueAtTime(1, at)
    }

    // decay / sustain
    var sustain = getValue(obs.sustain)
    if (sustain !== 1) {
      lastEvent.amp.gain.setTargetAtTime(getValue(obs.sustain), peakTime, getValue(obs.decay) / 8 || 0.0001)
    }
  }

  obs.triggerOff = function (at) {
    at = Math.max(at, context.audio.currentTime)
    var releaseTime = getValue(obs.release)
    var stopAt = at + releaseTime

    if (lastEvent && (!lastEvent.to || at < lastEvent.to)) {
      lastEvent.choker.gain.setValueAtTime(0, stopAt)
      lastEvent.to = stopAt

      Param.triggerOff(obs, stopAt)

      if (releaseTime) {
        lastEvent.amp.gain.cancelScheduledValues(at)
        lastEvent.amp.gain.setTargetAtTime(0, at, releaseTime / 8)
      }
    }

    return stopAt
  }

  obs.choke = function (at) {
    if (lastEvent && (!lastEvent.to || at < lastEvent.to)) {
      var attack = getValue(obs.attack)
      if (attack > 0.1) {
        lastEvent.to = at + 0.1
        lastEvent.choker.gain.setTargetAtTime(0, at, 0.02)
      } else {
        lastEvent.choker.gain.setValueAtTime(0, at)
        lastEvent.to = at
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
