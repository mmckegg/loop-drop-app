var Event = require('geval')
var interpolate = require('lib/interpolate.js')

module.exports = ParamTransform

function ParamTransform (context, params) {
  var releases = []
  var channels = []
  var transforms = []
  var lastValues = []
  var interpolateChannel = []

  params.forEach(function (container, i) {
    if (container.onSchedule) {
      container = { param: container }
    } else if (!(container instanceof Object)) {
      container = { value: container }
    }

    if (container.param) {
      var param = container.param

      if (param.onSchedule) {
        releases.push(param.onSchedule(schedule.bind(this, i)))
        interpolateChannel[i] = true
      } else if (typeof param === 'function') {
        releases.push(param(schedule.bind(this, i)))
      }
      if (param.getValueAt) {
        lastValues[i] = param.getValueAt(context.audio.currentTime)
      } else if (typeof param === 'function') {
        lastValues[i] = param()
      }

      channels[i] = []
    } else if (container.value != null) {
      lastValues[i] = container.value
    }

    if (container.transform) {
      transforms[i] = container.transform
    }
  })

  var broadcast = null

  return {
    onSchedule: Event(function (b) {
      broadcast = b
    }),

    getValueAt: function (time) {
      return getValueAt(time)
    },

    resend: function () {
      broadcast({
        value: getValueAt(context.audio.currentTime),
        at: context.audio.currentTime
      })
    },

    destroy: function () {
      while (releases.length) {
        releases.pop()()
      }
    }
  }

  // scoped

  function schedule (index, descriptor) {
    if (!interpolateChannel[index]) {
      descriptor = { value: descriptor, at: context.audio.currentTime }
    }

    if (descriptor.mode === 'cancel') {
      var currentValue = getChannelValueAt(index, descriptor.at)
      if (isFinite(currentValue) && getEndTime() > context.audio.currentTime) {
        descriptor.value = currentValue
        truncate(index, descriptor.at)
        channels[index].push(descriptor)
      } else {
        return false
      }
    }

    var toTime = descriptor.at + (descriptor.duration || 0)
    lastValues[index] = descriptor.value

    descriptor.fromValue = descriptor.fromValue != null
      ? descriptor.fromValue
      : getChannelValueAt(index, descriptor.at)

    truncate(index, descriptor.at)
    channels[index].push(descriptor)

    broadcastIfValid({
      at: descriptor.at,
      mode: descriptor.mode,
      value: getValueAt(toTime),
      duration: descriptor.duration
    })

    var endTime = getEndTime()
    if (endTime > toTime) {
      broadcastIfValid({
        at: toTime,
        value: getValueAt(endTime),
        duration: endTime - toTime
      })
    }

  }

  function broadcastIfValid (descriptor) {
    if (descriptor && isFinite(descriptor.value)) {
      broadcast(descriptor)
    }
  }

  function truncate (index, at) {
    var events = channels[index]
    var currentTime = context.audio.currentTime
    for (var i = events.length - 1; i >= 0; i--) {
      var to = events[i].at + (events[i].duration || 0)
      if (events[i].at > at || to < currentTime) {
        events.splice(i, 1)
      }
    }
  }

  function getEndTime () {
    var maxTime = context.audio.currentTime
    for (var i = 0; i < params.length; i++) {
      var events = channels[i]
      if (events) {
        var lastEvent = events[events.length - 1]
        if (lastEvent) {
          var endAt = lastEvent.at + (lastEvent.duration || 0)
          if (endAt > maxTime) {
            maxTime = endAt
          }
        }
      }
    }
    return maxTime
  }

  function getValueAt (time) {
    var lastValue = 1

    for (var i = 0; i < params.length; i++) {
      var value = getChannelValueAt(i, time)

      var l = lastValue

      if (transforms[i]) {
        lastValue = transforms[i](lastValue, value)
      } else {
        lastValue = value
      }

      if (typeof lastValue === 'number' && isNaN(lastValue)) {
        getChannelValueAt(i, time)
        transforms[i](l, value)
      }
    }

    return lastValue
  }

  function getChannelValueAt (index, time) {
    var events = channels[index]

    if (events) {
      for (var i = 0; i < events.length; i++) {
        var event = events[i]
        var next = events[i + 1]

        if (!next || next.at > time) {
          if (interpolateChannel[index]) {
            return interpolate(event, time)
          } else {
            return event.value
          }
        }
      }
    }

    return lastValues[index]
  }
}
