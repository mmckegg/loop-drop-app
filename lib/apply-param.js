var watch = require('mutant/watch')
var ParamSource = require('lib/param-source')

module.exports = ApplyParam

function ApplyParam (audioContext, target, param, at) {
  // optional: at (falls back to audioContext.currentTime)

  var destroyed = false
  var lastValue = null
  var releases = []

  var releaseWatch = watch(param.currentValue || param, function (value) {
    while (releases.length) {
      releases.pop()()
    }

    if (value !== lastValue) {
      cleanUpLastAudioNode()

      if (typeof value === 'number') {
        if (ParamSource.isParam(lastValue)) {
          target.cancelScheduledValues(audioContext.currentTime)
          target.setValueAtTime(value, audioContext.currentTime)
        }
        target.value = value
      } else if (ParamSource.isParam(value)) {
        releases.push(ParamSource.applyEvents(audioContext, value, target, at))
      } else if (value instanceof global.AudioNode) {
        target.value = 0
        value.connect(target)
      }
      lastValue = value
    }
  })

  return function () {
    if (destroyed) return
    while (releases.length) {
      releases.pop()()
    }
    releaseWatch()
    cleanUpLastAudioNode()
    destroyed = true
  }

  // scoped

  function cleanUpLastAudioNode () {
    if (lastValue instanceof global.AudioNode) {
      lastValue.disconnect(target)
    }
  }
}
