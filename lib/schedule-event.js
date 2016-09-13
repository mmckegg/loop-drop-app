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
  if (this.choker) {
    if (!this.to || at < this.to) {
      this.choker.gain.setTargetAtTime(0, at, 0.02)
      this.to = at + 0.1
    }
  }
}

ScheduleEvent.prototype.stop = function (at) {
  at = at || this.source.context.currentTime
  this.choker.gain.setValueAtTime(0, at)
  this.to = at
}

ScheduleEvent.prototype.cancelStop = function () {
  if (this.to) {
    this.choker.gain.cancelScheduledValues(this.source.context.currentTime)
    this.choker.gain.setValueAtTime(1, this.source.context.currentTime)
    this.to = null
  }
}

ScheduleEvent.prototype.destroy = function () {
  if (this.choker) {
    this.choker.disconnect()
  } else {
    this.source.disconnect()
  }
  if (this.releases) {
    while (this.releases.length) {
      this.releases.pop()()
    }
  }
}
