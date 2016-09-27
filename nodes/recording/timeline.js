var Struct = require('@mmckegg/mutant/struct')
var Value = require('@mmckegg/mutant/value')
var Slots = require('lib/slots')
var computed = require('@mmckegg/mutant/computed')
var MutantMap = require('@mmckegg/mutant/map')
var pullCat = require('pull-cat')
var pull = require('pull-stream')

module.exports = AudioTimeline

function AudioTimeline (parentContext) {
  var context = Object.create(parentContext)
  var output = context.output = context.audio.createGain()
  output.connect(parentContext.output || parentContext.audio.destination)

  var obs = Struct({
    primary: Slots(context)
  })

  obs.context = context

  obs.loading = computed(MutantMap(obs.primary, x => x.loading || false), function (loading) {
    return loading.filter(x => x).length
  })

  obs.primary.resolved = MutantMap(obs.primary, getResolved)

  obs.duration = computed([obs.primary.resolved], function (data) {
    return data.reduce(function (result, item) {
      return result + (item.duration || 0)
    }, 0)
  })

  obs.resolved = Struct({
    primary: obs.primary.resolved,
    duration: obs.duration
  })

  obs.start = function (at, offset, duration) {
    var stopAt = at + duration
    at = Math.max(at, context.audio.currentTime)
    offset = offset || 0

    var currentTime = at - offset
    obs.primary.forEach(function (clip, i) {
      var endTime = currentTime + clip.duration.resolved()
      if (at < endTime) {
        if (at > currentTime) {
          if (stopAt) {
            clip.start(at, at - currentTime, stopAt - at)
          } else {
            clip.start(at, at - currentTime)
          }
        } else {
          if (stopAt) {
            clip.start(currentTime, 0, stopAt - currentTime)
          } else {
            clip.start(currentTime)
          }
        }
      }
      currentTime = endTime
    })

    return currentTime
  }

  obs.stop = function (at) {
    obs.primary.forEach(function (clip) {
      clip.stop(at)
    })
  }

  obs.pull = function (timeOffset, duration) {
    timeOffset = Math.max(0, timeOffset || 0)
    duration = duration == null ? obs.duration() : duration
    duration = Math.min(obs.duration(), duration - timeOffset)

    var streams = []
    var currentTime = 0

    obs.primary.forEach(function (clip, i) {
      var endTime = currentTime + clip.duration.resolved()
      if (timeOffset <= currentTime && currentTime < duration) {
        streams.push(clip.pull(0, duration - currentTime))
        currentTime = endTime
      } else if (endTime < timeOffset) {
        var start = timeOffset - currentTime
        streams.push(clip.pull(start, duration - currentTime - start))
        currentTime = endTime - start
      }
    })

    var length = 0
    var blockSize = 32 * 2 / 8
    var progress = Value(0)

    var result = pull(
      pullCat(streams),
      pull.through((data) => {
        length += data.length / blockSize
        progress.set(length / (duration * context.audio.sampleRate))
      })
    )

    result.progress = progress
    return result
  }

  obs.destroy = function () {
    obs.primary.forEach(function (clip) {
      clip.destroy && clip.destroy()
    })
  }

  return obs
}

function getResolved (node) {
  return node && node.resolved || node
}
