var Timeline = require('./timeline')
var Property = require('lib/property')
var Event = require('geval')

module.exports = renderTimeline

function renderTimeline (parentContext, descriptor, startOffset, duration, cb) {
  var context = Object.create(parentContext)

  var sampleRate = parentContext.audio.sampleRate
  context.audio = new global.OfflineAudioContext(2, sampleRate * duration, sampleRate)
  context.output = context.audio.destination

  var broadcastSchedule = null
  context.scheduler = Event(function (res) {
    broadcastSchedule = res
  })

  var timeline = Timeline(context)

  var loaded = false
  var waiting = Property(false)
  var progress = Property(0)

  var resume = null
  var block = 0.2
  var currentTime = 0

  waiting(function (value) {
    if (!value && resume) {
      var fn = resume
      resume = null
      fn()
    }
  })

  timeline.loading(function (value) {
    if (!waiting() && value) {
      waiting.set(true)
    } else if (waiting() && !value) {
      waiting.set(false)
    }

    if (!loaded && !value) {
      loaded = true
      buildGraph()
    }
  })

  timeline.set(descriptor)

  function buildGraph () {
    timeline.start(0, startOffset, duration)
    schedule()
  }

  function schedule () {
    if (waiting()) {
      resume = schedule
    } else {
      broadcastSchedule([currentTime, block])
      currentTime += block
      progress.set(currentTime / duration * 0.4)

      if (currentTime < duration) {
        setImmediate(schedule)
      } else {
        render()
      }
    }
  }

  function render () {
    var tracker = context.audio.createScriptProcessor(4096 * 2, 0, 1)
    tracker.onaudioprocess = function (e) {
      progress.set(0.4 + (context.audio.currentTime / duration) * 0.6)
    }
    tracker.connect(context.audio.destination)
    context.audio.startRendering().then(function (renderedBuffer) {
      timeline.destroy()
      cb(null, renderedBuffer)
    }).catch(function (err) {
      timeline.destroy()
      cb && cb(err)
    })
  }

  return progress
}
