'use strict'

module.exports = ScheduleEvent

function ScheduleEvent (from, source, choker, releases) {
  this.from = from
  this.to = NaN
  this.releases = releases
  this.source = source
  this.choker = choker
}

ScheduleEvent.prototype.choke = function (at) {
  if (!this.to || at < this.to) {
    this.choker.gain.cancelScheduledValues(this.choker.context.currentTime)
    this.source.stop(at + 0.1)
    this.choker.gain.setTargetAtTime(0, at, 0.02)
    this.to = at + 0.1
  }
}

ScheduleEvent.prototype.stop = function (at) {
  at = at || this.source.context.currentTime
  this.choker.gain.cancelScheduledValues(this.choker.context.currentTime)
  this.source.stop(at)
  this.to = at
}
