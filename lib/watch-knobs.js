var watch = require('mutant/watch')

module.exports = watchKnobs

function watchKnobs (stream, keys, listener, defaultValue) {
  var currentStream = null
  var release = watch(stream, set)
  var currentValues = []
  var broadcastedValues = []
  var broadcastedAt = []
  var lastChangeAt = []
  var throttling = []
  var timers = []
  var minDelay = 10

  return function () {
    release && release()
    currentStream && currentStream.removeListener('data', handler)
  }
  // scoped

  function handler (message) {
    var key = message[0] + '/' + message[1]
    var index = keys.indexOf(key)
    if (~index) {
      broadcast(index, message[2])
    }
  }

  function broadcast (index, value) {
    currentValues[index] = value
    if (!throttling[index]) {
      if (Date.now() - lastChangeAt[index] > minDelay) {
        broadcastNow(index, value)
      } else {
        throttling[index] = true
        timers[index] = setInterval(function () {
          broadcastNow(index, currentValues[index])
        }, minDelay)
      }
    }
    lastChangeAt[index] = Date.now()
  }

  function broadcastNow (index, value) {
    broadcastedAt[index] = Date.now()

    if (broadcastedValues[index] !== value) {
      broadcastedValues[index] = value
      listener(index, value)
    }

    if (throttling[index] && broadcastedAt[index] - lastChangeAt[index] > minDelay) {
      throttling[index] = false
      clearInterval(timers[index])
    }
  }

  function set (newStream) {
    currentStream && currentStream.removeListener('data', handler)
    newStream && newStream.on('data', handler)
    currentStream = newStream
  }
}
