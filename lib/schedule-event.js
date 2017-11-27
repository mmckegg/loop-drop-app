'use strict'

var destroySourceNode = require('lib/destroy-source-node')

module.exports = ScheduleEvent

function ScheduleEvent (from, source, choker, releases) {
  this.destroyed = false
  this.from = from
  this.to = null
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
  if (typeof this.onChoke === 'function') {
    this.onChoke(at)
  }
}

ScheduleEvent.prototype.stop = function (at) {
  at = at || this.source.context.currentTime
  if (this.choker) {
    this.choker.gain.setValueAtTime(1, at)
    this.choker.gain.linearRampToValueAtTime(0, at + 0.00001)
  } else {
    this.source.stop(at)
  }
  this.to = at
}

ScheduleEvent.prototype.cancelStop = function (at) {
  if (this.to && this.choker) {
    at = at || this.source.context.currentTime
    this.choker.gain.cancelScheduledValues(at)
    this.choker.gain.setValueAtTime(1, at)
    if (at <= this.source.context.currentTime) {
      this.choker.gain.value = 1
    }
    this.to = null
  }
}

ScheduleEvent.prototype.destroy = function () {
  this.destroyed = true
  if (this.source && this.source.disconnect) {
    destroySourceNode(this.source)
  }

  if (this.releases) {
    while (this.releases.length) {
      this.releases.pop()()
    }
  }
}
