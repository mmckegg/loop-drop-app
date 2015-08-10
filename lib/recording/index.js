var Struct = require('observ-struct')
var Property = require('observ-default')
var WaveFileWriter = require('wav/lib/file-writer')

var remote = require('remote')
var Dialog = remote.require('dialog')
var Timeline = require('audio-timeline')
var RenderStream = require('audio-timeline/render-stream')

module.exports = Recording

function Recording (parentContext) {

  var context = Object.create(parentContext)

  //TODO: fs should already be in context
  context.fs = context.project._state.fs

  var obs = Struct({
    timeline: Timeline(context),
    scale: Property(10)
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
  obs.position = Property(0)
  var broadcastPosition = obs.position.set
  obs.position.set = function (value) {
    setPosition(value)
  }

  obs.resolved = Struct({
    timeline: obs.timeline.resolved,
    duration: obs.duration,
    playing: obs.playing,
    renderProgress: obs.renderProgress
  })

  obs.destroy = obs.timeline.destroy

  obs.renderProgress = Property(null)

  obs.exportFile = function (format) {
    Dialog.showSaveDialog({
      title: 'Export Recording (PCM Wave)',
      filters: [
        { name: 'PCM Wave', extensions: ['wav']}
      ]
    }, function (path) {
      if (path) {
        var bitDepth = 16
        var stream = RenderStream(obs.timeline, 0, obs.timeline.duration(), bitDepth)
        stream.progress(obs.renderProgress.set)
        stream.pipe(WaveFileWriter(path, {
          bitDepth: bitDepth,
          sampleRate: context.audio.sampleRate,
          channels: 2
        })).on('finish', function () {
          console.log('done')
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
    broadcastPosition(value)
    if (obs.playing()) {
      obs.timeline.stop(context.audio.currentTime+0.05)
      obs.timeline.start(context.audio+0.05, obs.position())
    }
  }

  function onSchedule (data) {
    var pos = obs.position() + data[1]
    broadcastPosition(Math.min(obs.duration(), pos))

    if (pos > obs.duration()) {
      obs.playing.set(false)
    }
  }
}