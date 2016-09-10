var Struct = require('@mmckegg/mutant/struct')
var Property = require('lib/property')
var WaveWriter = require('wav/lib/writer')
var Scheduler = require('lib/timeline-scheduler')
var electron = require('electron')
var Timeline = require('./timeline')
var RenderStream = require('./render-stream')
var throttledWatch = require('@mmckegg/mutant/watch-throttle')
var writeHeader = require('lib/write-header')
var getClosestPoint = require('lib/get-closest-point')
var extend = require('xtend')
var animateProp = require('animate-prop')

module.exports = Recording

function Recording (parentContext) {
  var context = Object.create(parentContext)
  context.scheduler = Scheduler(context.audio)
  context.output = parentContext.masterOutput

  var obs = Struct({
    timeline: Timeline(context),
    scale: Property(20)
  })

  obs._type = 'LoopDropRecording'

  context.recording = obs
  obs.context = context

  // playing
  obs.playing = Property(false)
  var lastPlaying = false
  var releasePositionIncrement = null
  obs.playing(function (value) {
    if (lastPlaying !== value) {
      lastPlaying = value
      if (value) {
        if (obs.position() >= obs.duration()) {
          obs.position.set(0)
        }
        start()
        releasePositionIncrement = context.scheduler(onSchedule)
      } else {
        stop()
        releasePositionIncrement && releasePositionIncrement()
      }
    }
  })

  // position
  obs.duration = obs.timeline.duration
  var lastBroadcastPosition = 0

  var userPosition = Property(0)
  obs.position = Property(0)
  obs.position(function (value) {
    if (value !== lastBroadcastPosition) {
      userPosition.set(value)
    }
  })

  throttledWatch(userPosition, 200, function (value) {
    setPosition(value)
  })

  obs.rendering = Property(false)
  obs.renderProgress = Property(null)

  obs.resolved = Struct({
    timeline: obs.timeline.resolved,
    duration: obs.duration,
    playing: obs.playing,
    rendering: obs.rendering
  })

  obs.destroy = obs.timeline.destroy

  obs.splice = function (snapToCue) {
    var info = getPositionInfo(obs.position())
    if (info) {
      var pos = snapToCue ?
        getClosestPoint(info.clip.cuePoints(), info.clip.startOffset() + info.clipOffset) - info.clip.startOffset() :
        info.clipOffset

      if (pos > 0 && pos < info.clip.resolved.duration()) {
        var newClip = extend(info.clip(), {
          startOffset: info.clip.startOffset() + pos,
          duration: info.clip.resolved.duration() - pos
        })
        obs.timeline.primary.insert(newClip, info.clipIndex + 1)
        info.clip.duration.set(pos)
        obs.centerOnCursor(true)
      }

    }
  }

  obs.nextCue = function () {
    var pos = obs.position()
    var info = getPositionInfo(pos)
    if (info) {
      var markers = info.clip.cuePoints()
      var time = info.clip.startOffset() + info.clipOffset
      if (markers) {
        for (var i = 0; i < markers.length; i++) {
          if (markers[i] >= time) {
            var marker = (markers[i] === time) ? markers[i+1] : markers[i]
            if (marker != null) {
              var offset = marker - time
              obs.position.set(pos + offset)
              obs.ensureCursorVisible(true)
              return true
            }
          }
        }
      }
    }
  }

  obs.centerOnCursor = function (animate) {
    window.requestAnimationFrame(function () {
      var timeline = document.querySelector('.ArrangementTimeline')
      if (timeline) {
        var newScroll = (obs.position() * obs.scale()) - Math.round(timeline.clientWidth / 2)
        if (animate) {
          animateProp(timeline, 'scrollLeft', newScroll, 200)
        } else {
          timeline.scrollLeft = newScroll
        }
      }
    })
  }

  obs.ensureCursorVisible = function (animate) {
    var timeline = document.querySelector('.ArrangementTimeline')
    if (timeline) {
      var startPos = timeline.scrollLeft / obs.scale()
      var endPos = (timeline.scrollLeft + timeline.clientWidth) / obs.scale()
      if (obs.position() < startPos || obs.position() > endPos) {
        obs.centerOnCursor(animate)
      }
    }
  }

  obs.prevCue = function () {
    var pos = obs.position()
    var info = getPositionInfo(pos)
    if (info) {
      var markers = info.clip.cuePoints()
      var time = info.clip.startOffset() + info.clipOffset
      if (markers) {
        for (var i = 0; i < markers.length; i++) {
          if (markers[i] >= time) {
            var marker = (markers[i] === time) ? markers[i - 2] : markers[i - 1]
            if (marker != null) {
              var offset = marker - time
              obs.position.set(pos + offset)
              obs.ensureCursorVisible(true)
              return true
            }
          }
        }
      }
    }
  }

  obs.exportFile = function (format) {
    electron.remote.dialog.showSaveDialog({
      title: 'Export Recording (PCM Wave)',
      filters: [
        { name: 'PCM Wave', extensions: ['wav']}
      ]
    }, function (path) {
      if (path) {
        var bitDepth = 32
        obs.rendering.set(true)
        var stream = RenderStream(obs.timeline, 0, obs.timeline.duration(), bitDepth)
        stream.progress(obs.renderProgress.set)

        var formatter = WaveWriter({
          bitDepth: bitDepth,
          format: bitDepth === 32 ? 3 : 1,
          sampleRate: context.audio.sampleRate,
          channels: 2
        })

        formatter.on('header', function (header) {
          writeHeader(path, header, context.fs)
        })

        stream.pipe(formatter).pipe(context.fs.createWriteStream(path)).on('finish', function () {
          obs.rendering.set(false)
        })
      }
    })
  }

  return obs

  // scoped

  function getPositionInfo (pos) {
    var current = 0
    for (var i = 0; i < obs.timeline.primary.getLength(); i++) {
      var clip = obs.timeline.primary.get(i)
      var endTime = current + clip.duration.resolved()
      if (pos >= current && pos < endTime) {
        return {
          clipIndex: i,
          clip: clip,
          clipOffset: pos - current
        }
      }
      current = endTime
    }
  }

  function start () {
    releasePositionIncrement && releasePositionIncrement()
    obs.timeline.start(context.audio.currentTime + 0.1, obs.position())
  }

  function stop () {
    obs.timeline.stop(context.audio.currentTime)
  }

  function setPosition (value) {
    if (obs.playing()) {
      obs.timeline.stop(context.audio.currentTime + 0.05)
      obs.timeline.start(context.audio.currentTime + 0.05, obs.position())
    }
  }

  function onSchedule (data) {
    var pos = obs.position() + data[1]
    lastBroadcastPosition = Math.min(obs.duration(), pos)
    obs.position.set(lastBroadcastPosition)

    if (pos > obs.duration()) {
      obs.playing.set(false)
    }
  }
}
