var Struct = require('observ-struct')
var Property = require('observ-default')
var WaveWriter = require('wav/lib/writer')

var remote = require('remote')
var Dialog = remote.require('dialog')
var Timeline = require('audio-timeline')
var RenderStream = require('audio-timeline/render-stream')
var throttledWatch = require('throttle-observ/watch')
var writeHeader = require('lib/write-header')

module.exports = Recording

function Recording (parentContext) {

  var context = Object.create(parentContext)

  //TODO: fs should already be in context
  context.fs = context.project._state.fs

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
        releasePositionIncrement = obs.timeline.context.scheduler(onSchedule)
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
    if (value != lastBroadcastPosition) {
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

  obs.exportFile = function (format) {
    Dialog.showSaveDialog({
      title: 'Export Recording (PCM Wave)',
      filters: [
        { name: 'PCM Wave', extensions: ['wav']}
      ]
    }, function (path) {
      if (path) {
        var bitDepth = 16
        obs.rendering.set(true)
        var stream = RenderStream(obs.timeline, 0, obs.timeline.duration(), bitDepth)
        stream.progress(obs.renderProgress.set)
        var formatter = WaveWriter({
          bitDepth: bitDepth,
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

  function start () {
    releasePositionIncrement && releasePositionIncrement()
    obs.timeline.start(context.audio.currentTime+0.1, obs.position())
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
