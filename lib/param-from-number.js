var Voltage = require('lib/create-voltage')
var computed = require('@mmckegg/mutant/computed')
var Apply = require('lib/apply-param')

module.exports = function NumberParam (audioContext, value) {
  var voltage = Voltage(audioContext, 1)
  voltage.start()

  var releases = []
  var result = audioContext.createGain()
  var target = result.gain

  return computed([value], function (value) {
    return result
  }, {
    comparer: (a, b) => a === b,
    onListen: function () {
      voltage.connect(result)
      releases.push(
        Apply(audioContext, target, value)
      )
    },
    onUnlisten: function () {
      voltage.disconnect(result)
      while (releases.length) {
        releases.pop()()
      }
    }
  })
}
