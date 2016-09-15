var Voltage = require('lib/create-voltage')
var computed = require('@mmckegg/mutant/computed')
var ParamSource = require('lib/param-source')

module.exports = function NumberParam (audioContext, value) {
  var player = null
  var releases = []
  var result = audioContext.createGain()
  var target = result.gain
  var currentParam = null
  var lastValue = null
  var live = false

  return computed([value], function (value) {
    currentParam = null
    release()

    if (typeof value === 'number') {
      target.value = value || 0.00000000001
    } else if (ParamSource.isParam(value)) {
      // lazy params
      currentParam = value
      if (live) {
        applyParam()
      }
    }
    lastValue = value
    return result
  }, {
    onListen: function () {
      if (!player) {
        player = Voltage(audioContext, 1)
        player.start()
      }

      if (currentParam) {
        applyParam()
      }

      live = true
      player.connect(result)
    },
    onUnlisten: function () {
      release()
      live = false
      player.disconnect(result)
    }
  })
  // scoped
  function release () {
    while (releases.length) {
      releases.pop()()
    }
  }

  function applyParam () {
    if (typeof lastValue === 'number') {
      target.setValueAtTime(currentParam.getValueAtTime(audioContext.currentTime), audioContext.currentTime)
    }
    releases.push(ParamSource.applyEvents(audioContext, currentParam, target))
  }
}
