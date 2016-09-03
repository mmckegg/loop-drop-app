var Node = require('observ-node-array/single')
var ResolvedValue = require('observ-node-array/resolved-value')
var Param = require('lib/param')
var Property = require('observ-default')
var Transform = require('lib/param-transform')
var Apply = require('lib/apply-param')

var Triggerable = require('lib/triggerable')
var ScheduleList = require('lib/schedule-list')
var ScheduleEvent = require('lib/schedule-event')
var SyncProperty = require('./granular-sync')

module.exports = GranularNode

function GranularNode (context) {
  var output = context.audio.createGain()
  var amp = context.audio.createGain()
  amp.gain.value = 0
  amp.connect(output)

  var offset = Property([0, 1])
  var buffer = Node(context)
  var resolvedBuffer = ResolvedValue(buffer)
  var duration = Property(1)
  var sync = SyncProperty(duration, offset, resolvedBuffer)

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
  }, trigger)

  obs.resolvedBuffer = resolvedBuffer
  obs.context = context

  var playbackRate = Transform(context, [ 1,
    { param: context.noteOffset, transform: noteOffsetToRate },
    { param: obs.transpose, transform: noteOffsetToRate },
    { param: obs.tune, transform: centsToRate }
  ])

  Apply(context, amp.gain, obs.amp)

  obs.connect = output.connect.bind(output)
  obs.disconnect = output.disconnect.bind(output)

  return obs

  // scoped
  function trigger (at) {
    return new GranularSample(obs, amp, playbackRate, at)
  }
}

function noteOffsetToRate (baseRate, value) {
  return baseRate * Math.pow(2, value / 12)
}

function centsToRate (baseRate, value) {
  return baseRate * Math.pow(2, value / 1200)
}

// internal class

function GranularSample (obs, output, playbackRate, from) {
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
  this.events = ScheduleList()
  this.releases = [this.events.destroy]
  this.playbackRate = playbackRate

  if (this.oneshot) {
    this.to = from + length
  }

  this.choker.connect(output)

  if (handleSchedule.call(this, schedule)) {
    this.releases.push(clock.onSchedule(handleSchedule.bind(this)))
  }
}

GranularSample.prototype.choke = function (at) {
  if (!this.to || at < this.to) {
    this.choker.gain.cancelScheduledValues(this.choker.context.currentTime)
    this.choker.gain.setTargetAtTime(0, at, 0.02)
    this.to = at + 0.1
  }
}

GranularSample.prototype.stop = function (at) {
  at = at || this.choker.context.currentTime
  this.choker.gain.cancelScheduledValues(this.choker.context.currentTime)
  this.choker.gain.setValueAtTime(0, at)
  this.stopAt = at
  this.to = at
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
        this.events.push(event)
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
  var buffer = obs.resolvedBuffer()
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

    source.playbackRate.value = this.playbackRate.getValueAt(at)

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
    envelope.connect(this.choker)

    var event = new ScheduleEvent(at, source, envelope, [
      Apply(context, source.playbackRate, this.playbackRate)
    ])

    event.to = releaseAt + release

    return event
  }
}
