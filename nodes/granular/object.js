var Param = require('lib/param')
var Property = require('lib/property')
var Sum = require('lib/param-sum')
var Multiply = require('lib/param-multiply')
var Apply = require('lib/apply-param')

var Triggerable = require('lib/triggerable')
var ScheduleEvent = require('lib/schedule-event')
var SyncProperty = require('./granular-sync')

module.exports = GranularNode

function GranularNode (context) {
  var output = context.audio.createGain()
  var offset = Property([0, 1])
  var buffer = Param(context)
  var duration = Property(1)
  var sync = SyncProperty(duration, offset, buffer.currentValue)
  var releases = []

  var obs = Triggerable(context, {
    mode: Property('loop'),

    sync: sync,
    offset: offset,
    buffer: buffer,
    duration: duration,

    rate: Property(8),

    attack: Property(0.1),
    hold: Property(1),
    release: Property(0.1),

    transpose: Param(context, 0),
    tune: Param(context, 0),
    amp: Param(context, 1)
  }, trigger, releases)

  obs.context = context

  var detune = Sum([
    toCents(context.noteOffset),
    toCents(obs.transpose),
    obs.tune
  ])

  obs.connect = output.connect.bind(output)
  obs.disconnect = output.disconnect.bind(output)

  var currentBuffer = null
  releases.push(
    obs.buffer.currentValue(v => currentBuffer = v)
  )

  return obs

  // scoped
  function trigger (at) {
    return new GranularSample(obs, output, detune, currentBuffer, at)
  }
}

// internal class

function GranularSample (obs, output, detune, buffer, from) {
  var clock = obs.context.scheduler
  var nextTime = clock.getNextScheduleTime()
  var schedule = {
    time: from,
    duration: nextTime - from,
    beatDuration: clock.getBeatDuration()
  }

  var length = obs.duration()
  if (obs.sync()) {
    length = length * schedule.beatDuration
  }

  this.context = obs.context
  this.obs = obs
  this.from = from
  this.to = NaN
  this.nextTime = from
  this.nextOffset = 0
  this.choker = obs.context.audio.createGain()
  this.oneshot = obs.mode() === 'oneshot'
  this.detune = detune
  this.releases = []
  this.buffer = buffer

  if (this.oneshot) {
    this.to = from + length
  }

  this.amp = obs.context.audio.createGain()
  this.amp.connect(this.choker)

  this.releaseAmp = Apply(obs.context.audio, this.amp.gain, obs.amp, from)
  this.releases.push(this.releaseAmp)
  this.choker.connect(output)

  if (handleSchedule.call(this, schedule)) {
    this.releases.push(clock.onSchedule(handleSchedule.bind(this)))
  }
}

GranularSample.prototype.choke = function (at) {
  if (!this.to || at < this.to) {
    this.choker.gain.cancelScheduledValues(this.choker.context.currentTime)
    this.choker.gain.setTargetAtTime(0, at, 0.02)
    this.choker.gain.setValueAtTime(0, at + 0.1)
    this.to = at + 0.1
    this.releaseAmp()
  }
}

GranularSample.prototype.stop = function (at) {
  at = at || this.choker.context.currentTime
  this.choker.gain.cancelScheduledValues(this.choker.context.currentTime)
  this.choker.gain.setValueAtTime(0, at)
  this.stopAt = at
  this.to = at
}

GranularSample.prototype.destroy = function (at) {
  this.choker.disconnect()
  while (this.releases.length) {
    this.releases.pop()()
  }
}

function handleSchedule (schedule) {
  var obs = this.obs
  var endTime = schedule.time + schedule.duration

  if (endTime >= this.from && (!this.to || schedule.time < this.to)) {
    var length = obs.duration()
    var rate = obs.rate()

    if (obs.sync()) {
      length = length * schedule.beatDuration
      rate = rate / schedule.beatDuration
    }

    var slices = Math.max(1, rate) * length
    var duration = length / slices

    while (this.nextTime < endTime) {
      var event = play.call(this, this.nextTime, this.nextOffset, duration)
      if (event) {
        this.context.cleaner.push(event)
      }
      this.nextTime += duration
      this.nextOffset += 1 / slices
      if (obs.mode() !== 'oneshot') {
        this.nextOffset = this.nextOffset % 1
      }
    }
  }

  if (!this.to || this.to > endTime) {
    return true
  }
}

function play (at, startOffset, grainDuration) {
  var obs = this.obs
  var context = this.context
  var buffer = this.buffer
  if (buffer instanceof window.AudioBuffer && isFinite(startOffset) && grainDuration) {
    var source = context.audio.createBufferSource()
    source.buffer = buffer

    var offset = obs.offset()
    var start = offset[0] * source.buffer.duration
    var end = offset[1] * source.buffer.duration
    var duration = end - start

    var release = grainDuration * obs.release()
    var attack = grainDuration * obs.attack()

    // make sure it doesn't exceed the stop time
    var maxTime = (this.to || Infinity) - release
    var releaseAt = Math.min(at + grainDuration * obs.hold(), maxTime)

    if (obs.mode() !== 'oneshot' && releaseAt + release > startOffset * duration) {
      source.loop = true
      source.loopStart = start
      source.loopEnd = end
    }

    source.start(at, startOffset * duration + start)
    source.stop(releaseAt + release * 2)

    var envelope = context.audio.createGain()
    envelope.gain.value = 0
    source.connect(envelope)

    // envelope
    if (attack) {
      envelope.gain.setTargetAtTime(1, at, attack / 4)
    }
    envelope.gain.setTargetAtTime(0, releaseAt, release / 4)
    envelope.connect(this.amp)

    var event = new ScheduleEvent(at, source, envelope, [
      Apply(context.audio, source.detune, this.detune)
    ])

    event.to = releaseAt + release

    return event
  }
}

function toCents (param) {
  return Multiply([param, 100])
}
