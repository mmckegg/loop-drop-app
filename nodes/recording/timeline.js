var Struct = require('mutant/struct')
var resolve = require('mutant/resolve')
var Slots = require('lib/slots')
var computed = require('mutant/computed')
var MutantMap = require('mutant/map')
var pullCat = require('pull-cat')
var pull = require('pull-stream')
var lookup = require('mutant/lookup')
var StreamProgress = require('lib/stream-progress')

module.exports = AudioTimeline

function AudioTimeline (parentContext) {
  var context = Object.create(parentContext)
  var output = context.output = context.audio.createGain()
  output.connect(parentContext.output || parentContext.audio.destination)

  var obs = Struct({
    primary: Slots(context),
    secondary: Slots(context)
  })

  obs.secondary.getLinkedTo = (id) => selectLinked(obs.secondary, id)

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
    duration: obs.duration,
    sampleRate: computed(obs.primary.resolved, clips => clips[0] && clips[0].sampleRate || null)
  })

  obs.start = function (at, offset, duration) {
    var stopAt = at + duration
    at = Math.max(at, context.audio.currentTime)
    offset = offset || 0

    var currentTime = at - offset
    obs.primary.forEach(function (primaryClip, i) {
      var linked = selectLinked(obs.secondary, resolve(primaryClip.id))
      var endTime = playClip(primaryClip, at, currentTime, stopAt)
      linked.forEach((clip, i) => {
        playClip(clip, at, currentTime, stopAt)
      })
      currentTime = endTime
    })

    return currentTime
  }

  obs.stop = function (at) {
    obs.primary.forEach(function (clip) {
      clip.stop(at)
    })
    obs.secondary.forEach(function (clip) {
      clip.stop(at)
    })
  }

  obs.pull = function (timeOffset, duration) {
    timeOffset = Math.max(0, timeOffset || 0)
    duration = duration == null ? obs.duration() : duration
    duration = Math.min(obs.duration(), duration - timeOffset)

    var sampleRate = resolve(obs.resolved.sampleRate)
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

    var progressWatcher = StreamProgress({duration, sampleRate})

    var result = pull(
      pullCat(streams),
      progressWatcher
    )

    result.sampleRate = sampleRate
    result.progress = progressWatcher.value
    return result
  }

  obs.destroy = function () {
    obs.primary.forEach(function (clip) {
      clip.destroy && clip.destroy()
    })
  }

  return obs

  function playClip (clip, at, currentTime, stopAt) {
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
    return endTime
  }
}

function getResolved (node) {
  return node && node.resolved || node
}

function selectLinked (collection, id) {
  var result = []
  collection.forEach(item => {
    if (resolve(item.linkTo) === id) {
      result.push(item)
    }
  })
  return result
}
