var Apply = require('lib/apply-param')
var ObservStruct = require('@mmckegg/mutant/struct')
var Property = require('lib/property')
var computed = require('@mmckegg/mutant/computed')
var watchAll = require('@mmckegg/mutant/watch-all')
var ScheduleEvent = require('lib/schedule-event')

var Param = require('lib/param')
var Multiply = require('lib/param-multiply')
var Negate = require('lib/param-negate')
var Sum = require('lib/param-sum')

module.exports = LFO

function LFO (context) {
  var obs = ObservStruct({
    mode: Property('multiply'),
    sync: Property(false),
    trigger: Property(true),

    rate: Param(context, 1),
    amp: Param(context, 1),
    value: Param(context, 1),

    phaseOffset: Property(0),
    curve: Property(1),
    skew: Property(0)
  })

  obs.context = context
  obs.getReleaseDuration = Param.getReleaseDuration.bind(this, obs)

  var currentEvent = null
  var buffer = context.audio.createBuffer(1, 1 * context.audio.sampleRate, context.audio.sampleRate)
  watchAll([buffer, obs.curve, obs.skew], refreshBuffer, { nextTick: true })

  var outputValue = context.audio.createGain()
  obs.currentValue = computed([obs.mode], function (mode) {
    if (mode === 'multiply') {
      return Sum([
        Multiply([outputValue, obs.value]),
        obs.value
      ])
    } else if (mode === 'add') {
      return Sum([outputValue, obs.value])
    } else if (mode === 'subtract') {
      return Sum([outputValue, Negate(obs.value)])
    }
  })

  var rateMultiplier = computed([obs.sync, context.tempo], getRateMultiplier)
  var rate = Multiply([rateMultiplier, obs.rate])

  Apply(context, outputValue.gain, obs.amp)

  obs.triggerOn = function (at) {
    if (obs.trigger()) {
      start(at, 0)
    } else {
      var cycleTime = 1 / rate()
      var offset = typeof rate() === 'number'
        ? obs.sync()
          ? (context.scheduler.getPositionAt(at) % cycleTime) / cycleTime
          : (at % cycleTime) / cycleTime
        : 0
      start(at, offset)
    }
    Param.triggerOn(obs, at)
  }

  obs.triggerOff = function (at) {
    var stopAt = stop(at)
    Param.triggerOff(obs, stopAt)
  }

  obs.destroy = function () {
    Param.destroy(obs)
  }

  return obs

  // scoped

  function start (at, offset) {
    if (currentEvent) {
      currentEvent.source.stop(at)
      currentEvent.to = at
      currentEvent = null
    }
    var player = context.audio.createBufferSource()
    player.buffer = buffer
    player.loop = true
    player.start(at, mod(obs.phaseOffset() + (offset || 0), 1))
    player.connect(outputValue)
    currentEvent = new ScheduleEvent(at, player, null, [
      Apply(context, player.playbackRate, rate)
    ])
    context.cleaner.push(currentEvent)
  }

  function stop (at) {
    if (currentEvent && (!currentEvent.to || currentEvent.to > at)) {
      currentEvent.source.stop(at)
      currentEvent.to = at
    }
    return at
  }
}

function clamp (value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function refreshBuffer (buffer, curve, skew) {
  var data = buffer.getChannelData(0)
  var stepDuration = data.length / 4
  var skewValue = clamp((skew + 1), 0.1, 1.9999999999)
  var curveValue = clamp(curve, 0, 1)
  var up = stepDuration * skewValue * curveValue
  var pause = (stepDuration - curveValue * stepDuration) * 2
  var down = stepDuration * (2 - skewValue) * curveValue

  var phases = [
    [0, up],
    [up + pause, down],
    [up + pause + down, down],
    [up + pause + down + down + pause, up]
  ]

  var phase = 0
  for (var i = 0; i < data.length; i++) {
    if (phases[phase + 1] && phases[phase + 1][0] <= i) {
      phase += 1
    }
    var index = i - phases[phase][0]
    data[i] = getValue(index, phases[phase][1], phase)
  }

  return buffer
}

function getValue (index, length, phase) {
  var pos = Math.min(index / length, 1)
  if (phase === 1) {
    return 1 - pos
  } else if (phase === 2) {
    return 0 - pos
  } else if (phase === 3) {
    return -1 + pos
  } else {
    return pos
  }
}

function getRateMultiplier (sync, tempo) {
  if (sync) {
    return tempo / 60
  } else {
    return 1
  }
}

function mod (n, m) {
  return ((n % m) + m) % m
}
