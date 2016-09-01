var getEvents = require('lib/get-events')

module.exports = Holder

function Holder (transform) {
  var release = null

  var holding = false
  var length = 2
  var start = null
  var doneCallback = null

  function refresh () {
    if (holding) {
      var oldRelease = release
      release = transform(hold, start, length, holding)
      oldRelease && oldRelease()
    } else if (release) {
      release()
      release = null
    }
  }

  var self = {
    getLength: function () {
      return length
    },
    setLength: function (value) {
      if (length !== value) {
        length = value
        refresh()
      }
    },
    start: function (position, indexes, done) {
      self.stop()
      start = position
      holding = indexes || []
      doneCallback = done
      refresh()
    },
    stop: function () {
      if (holding) {
        holding = false
        refresh()
      }
      if (typeof doneCallback === 'function') {
        doneCallback()
        doneCallback = null
      }
    }
  }

  return self
}

function hold (input, start, length, indexes) {
  var end = start + length
  input.data.forEach(function (loop, i) {
    if (loop && (loop.events.length > 1) && (!indexes || !indexes.length || ~indexes.indexOf(i))) {
      var events = getEvents(loop, start, end, 0.5)

      if (events.every(isOff)) {
        events = []
      } else {
        if (events.length === 1) {
          var time = round10(events[0][0] + (length / 2))
          events.push([time, null])
        }
      }

      events = events.map(function (data) {
        return [mod(data[0], length)].concat(data.slice(1))
      }).sort(byPosition)
      input.data[i] = {
        events: events,
        length: length
      }
    }
  })
  return input
}

function byPosition (a, b) {
  return a[0] - b[0]
}

function round10 (value) {
  return Math.round(value * 10000000000) / 10000000000
}

function mod (v, n) {
  return round10((v * 100) % (n * 100)) / 100
}

function isOff (event) {
  return !event[1]
}
