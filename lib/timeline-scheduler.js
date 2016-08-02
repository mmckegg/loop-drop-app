module.exports = AudioTimelineScheduler

function AudioTimelineScheduler (audioContext) {
  var listeners = []
  var timer = null
  var lastTime = audioContext.currentTime
  var lastSchedule = null

  var obs = function (listener) {
    if (!listeners.length) {
      lastTime = audioContext.currentTime
      listeners.push(listener)
      schedule()
      timer = setInterval(schedule, 50)
    } else {
      listener(lastSchedule)
      listeners.push(listener)
    }
    return function remove () {
      var index = listeners.indexOf(listener)
      if (~index) listeners.splice(index, 1)
      if (!listeners.length) {
        clearInterval(timer)
      }
    }
  }

  return obs

  // scoped

  function schedule () {
    var to = audioContext.currentTime + 0.1
    var data = [lastTime, to - lastTime]
    lastTime = to
    for (var i = 0;i < listeners.length;i++) {
      listeners[i](data)
    }
    lastSchedule = data
  }
}
