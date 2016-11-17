var watch = require('@mmckegg/mutant/watch')
var ParamSource = require('lib/param-source')

module.exports = ApplyParam

function ApplyParam (audioContext, target, param) {
  var lastValue = null
  var releases = []

  var releaseWatch = watch(param.currentValue || param, function (value) {
    while (releases.length) {
      releases.pop()()
    }

    var at = audioContext.currentTime

    if (value !== lastValue) {
      cleanUpLastAudioNode()

      if (typeof value === 'number') {
        target.value = value
      } else if (ParamSource.isParam(value)) {
        releases.push(ParamSource.applyEvents(audioContext, value, target))
      } else if (value instanceof global.AudioNode) {
        target.value = 0
        value.connect(target)
      }
      lastValue = value
    }
  })

  return function () {
    while (releases.length) {
      releases.pop()()
    }
    releaseWatch()
    cleanUpLastAudioNode()
  }

  // scoped

  function cleanUpLastAudioNode () {
    if (lastValue instanceof global.AudioNode) {
      lastValue.disconnect(target)
    }
  }
}
