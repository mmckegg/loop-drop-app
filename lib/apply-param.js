var watch = require('@mmckegg/mutant/watch')

module.exports = ApplyParam

function ApplyParam (context, target, param, boundEvent) {
  var lastValue = null
  var unwatch = watch(param.currentValue || param, function (value) {
    var at = context.audio.currentTime
    if (value !== lastValue) {
      if (lastValue instanceof global.AudioNode) {
        lastValue.disconnect(target)
      }

      if (typeof value === 'number') {
        if (typeof lastValue === 'number') {
          // dezippering
          target.setValueAtTime(lastValue, at)
          target.linearRampToValueAtTime(value, at + 0.01)
        } else {
          target.setValueAtTime(value, at)
        }
      } else if (value instanceof global.AudioNode) {
        target.setValueAtTime(0, at)
        value.connect(target)
      }
      lastValue = value
    }
  })

  if (boundEvent) {
    pendingCleanUp.push([boundEvent, unwatch, context.audio])
  } else {
    return unwatch
  }
}

// rubbish collection day
var pendingCleanUp = []
setInterval(function () {
  for (var i = pendingCleanUp.length - 1; i >= 0; i--) {
    var event = pendingCleanUp[i][0]
    var release = pendingCleanUp[i][1]
    var audioContext = pendingCleanUp[i][2]
    if (event.to && event.to < audioContext.currentTime) {
      release()
      if (i > 0) {
        pendingCleanUp[i] = pendingCleanUp.pop() // optimisation, lol :)
      } else {
        pendingCleanUp.pop()
      }
    }
  }
}, 500)
