var Observ = require('@mmckegg/mutant/value')
var Property = require('lib/property')

module.exports = function (duration, offset, buffer) {
  var obs = Property(false)
  var refreshing = false
  var lastBuffer = null

  obs.beats = Observ()
  obs.trim = Observ()
  obs.beatOffset = Observ()
  obs.tempo = Observ()

  var setBeats = obs.beats.set
  var setTrim = obs.trim.set
  var setBeatOffset = obs.beatOffset.set
  var setTempo = obs.tempo.set

  obs.beats.set = function (value) {
    if (buffer()) {
      value = Math.max(1 / 32, value)
      var beats = (obs.tempo() / 60) * buffer().duration
      var length = value / beats
      offset.set([offset()[0], offset()[0] + length])
      duration.set(value)
    }
  }

  obs.trim.set = function (value) {
    if (buffer()) {
      value = obs.beatOffset() + Math.max(0, Math.min(value, 0.99999))
      var beats = (obs.tempo() / 60) * buffer().duration
      var pos = value / beats
      var diff = offset()[1] - offset()[0]
      offset.set([pos, pos + diff])
    }
  }

  obs.beatOffset.set = function (value) {
    if (buffer()) {
      value = obs.trim() + Math.max(0, value)
      var beats = (obs.tempo() / 60) * buffer().duration
      var pos = value / beats
      var diff = offset()[1] - offset()[0]
      offset.set([pos, pos + diff])
    }
  }

  obs.tempo.set = function (value) {
    if (buffer()) {
      var originalDuration = getOffsetDuration(buffer().duration, offset())
      duration.set(value / 60 * originalDuration)
    }
  }

  var releases = [
    duration(refresh),
    offset(refresh),
    buffer(refresh)
  ]

  obs.destroy = function () {
    while (releases.length) {
      releases.pop()()
    }
  }

  return obs

  function refresh () {
    if (!refreshing) {
      refreshing = true
      setImmediate(refreshNow)
    }
  }

  function refreshNow () {
    refreshing = false
    if (buffer()) {
      var originalDuration = getOffsetDuration(buffer().duration, offset())
      var tempo = duration() / originalDuration * 60
      var fullBeats = (tempo / 60) * buffer().duration
      var beats = getOffsetDuration(fullBeats, offset())

      var fullOffset = Math.round(fullBeats * offset()[0] * 10000) / 10000
      var beatOffset = Math.floor(fullOffset)
      var trim = fullOffset - beatOffset

      if (tempo !== obs.tempo()) {
        setTempo(tempo)
      }

      if (beatOffset !== obs.beatOffset()) {
        setBeatOffset(beatOffset)
      }

      if (trim !== obs.trim()) {
        setTrim(trim)
      }

      if (beats !== obs.beats()) {
        setBeats(beats)
      }

      if (lastBuffer !== buffer()) {
        // bump refresh
        lastBuffer = buffer()
        if (obs()) {
          obs.set(true)
        }
      }
    }
  }
}

function getOffsetDuration (duration, offset) {
  return (offset[1] * duration) - (offset[0] * duration)
}
