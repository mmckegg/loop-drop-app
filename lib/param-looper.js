var Value = require('mutant/value')
var resolve = require('mutant/resolve')
var watch = require('mutant/watch')
var scaleInterpolate = require('lib/scale-interpolate')
var computed = require('mutant/computed')

var getEvents = require('lib/get-events')
var ParamSource = require('lib/param-source')
var quantizeDuration = require('lib/quantize-duration')

module.exports = ParamLooper

function ParamLooper (context, value) {
  var playing = Value(false)
  var recording = Value(false)
  var paramState = {}

  var outputParam = ParamSource(context, resolve(value))

  var releases = [
    value(value => {
      var currentValue = outputParam.getValueAtTime(context.audio.currentTime)
      var currentPos = context.scheduler.getCurrentPosition()

      if (recording()) {
        recordedEvents.push([currentPos, value])
        changed = true
      }

      // a little tolerance in case we bump the knob immediately after recording stops
      if (playing() && context.audio.currentTime - endedAt > 0.2) {
        playing.set(false)
        paramState.interpolatingFrom = currentValue
      }

      var newValue = scaleInterpolate(currentValue * 128, value * 128, paramState) / 128

      outputParam.linearRampToValueAtTime(newValue, context.audio.currentTime + 0.01)
    }),
    context.scheduler.onSchedule(schedule => {
      if (playing() && currentLoop) {
        var events = getEvents(currentLoop, schedule.from, schedule.to)
        events.forEach(event => {
          var delta = (event[0] - schedule.from) * schedule.beatDuration
          outputParam.linearRampToValueAtTime(event[1], schedule.time + delta + 0.01)
          recordedEvents.push(event)
        })
      }
    })
  ]

  var loopStart = 0
  var loopEnd = 0
  var endedAt = 0
  var recordedEvents = []
  var currentLoop = null
  var changed = false

  watch(computed(recording, x => x), recording => {
    if (recording) {
      changed = false
      recordedEvents.length = 0
      loopStart = context.scheduler.getCurrentPosition()
      recordedEvents.push([loopStart, outputParam.getValueAtTime(context.audio.currentTime)])
    } else {
      loopEnd = context.scheduler.getCurrentPosition()
      endedAt = context.audio.currentTime
      if (changed) {
        currentLoop = getLoop(recordedEvents, loopStart, loopEnd)
        playing.set(true)
      }
    }
  })

  return {
    recording, // observable (set value to start recording)
    playing,
    set: function (value) {
      playing.set(false)
      outputParam.linearRampToValueAtTime(value, context.audio.currentTime + 0.01)
      paramState.interpolatingFrom = value
    },
    currentValue: outputParam,
    destroy: function () {
      while (releases.length) {
        releases.pop()()
      }
    }
  }
}

function getLoop (events, startPos, endPos) {
  var duration = quantizeDuration(endPos - startPos)
  startPos = endPos - duration

  var filteredEvents = []
  var last = null

  for (var i = 0; i < events.length; i++) {
    if (events[i][0] < endPos) {
      if (last) {
        filteredEvents.push(last)
        last = null
      }
      filteredEvents.push(events[i])
    } else {
      last = events[i]
    }
  }

  var loop = {
    length: duration,
    events: filteredEvents.map(event => [event[0] % duration, event[1]]).sort((a, b) => a[0] - b[0])
  }

  return loop
}
