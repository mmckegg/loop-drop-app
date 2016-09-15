var watch = require('@mmckegg/mutant/watch')
var ParamSource = require('lib/param-source')

module.exports = ApplyParam

function ApplyParam (context, target, param) {
  var lastValue = null
  var wrapper = null
  var releases = []

  var releaseWatch = watch(param.currentValue || param, function (value) {
    while (releases.length) {
      releases.pop()()
    }

    var at = context.audio.currentTime

    if (value !== lastValue) {
      cleanUpLastAudioNode()

      if (typeof value === 'number') {
        if (typeof lastValue === 'number') {
          // dezippering
          target.setValueAtTime(lastValue, at)
          target.linearRampToValueAtTime(value, at + 0.01)
        } else {
          target.setValueAtTime(value, at)
        }
      } else if (ParamSource.isParam(value)) {
        target.setValueAtTime(value.getValueAtTime(at), at)
        releases.push(ParamSource.applyEvents(context.audio, value, target))
      } else if (value instanceof global.AudioNode) {
        // smooth transitions between signals
        wrapper = context.audio.createGain()
        wrapper.gain.value = 0
        value.connect(wrapper).connect(target)
        target.setValueAtTime(0, at)
        wrapper.gain.setValueAtTime(1, at)
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
      // smooth transitions between signals
      wrapper.gain.setValueAtTime(0, context.audio.currentTime)
      context.cleaner.push({
        to: context.audio.currentTime + 0.05,
        destroy: disconnect,
        connections: [lastValue, wrapper, target]
      })
    }
  }
}

function disconnect () {
  for (var i = 0; i < this.connections - 1; i++) {
    this.connections.disconnect(this.connections[i + 1])
  }
}
