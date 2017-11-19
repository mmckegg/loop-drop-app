var watch = require('mutant/watch')
var ObservStruct = require('mutant/struct')
var AbletonLink = require('abletonlink')
var Property = require('lib/property')
var Value = require('mutant/value')

module.exports = LinkSync

function LinkSync (context) {
  var link = new AbletonLink(context.tempo())
  var obs = ObservStruct({
    syncOffset: Property(0)
  })

  obs.peerCount = Value(0)

  var cycleDuration = 60
  var updating = false

  window.offset = 0

  link.on('numPeers', obs.peerCount.set)

  link.startUpdate(cycleDuration, (beat, phase, bpm) => {
    updating = true
    context.tempo.set(bpm)
    var offset = obs.syncOffset() * context.tempo() / 60000
    var currentPosition = context.scheduler.getPositionAt(context.audio.currentTime - 0.02) + offset
    var difference = (currentPosition + window.offset) - beat
    var multiplier = 1 - difference
    context.scheduler.setSpeed(multiplier)
    updating = false
  })

  var releases = [
    watch(context.tempo, (value) => {
      if (!updating) {
        link.bpm = value
      }
    })
  ]

  obs.context = context

  obs.destroy = function () {
    link.stopUpdate()
    link.disable()
    while (releases.length) {
      releases.pop()()
    }
  }

  return obs
}
