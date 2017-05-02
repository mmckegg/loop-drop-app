var computed = require('mutant/computed')
var Apply = require('lib/apply-param')
var destroySourceNode = require('lib/destroy-source-node')

module.exports = function NumberParam (audioContext, value) {
  var releases = []
  var result = audioContext.createGain()
  var target = result.gain

  return computed([value], function (value) {
    return result
  }, {
    comparer: (a, b) => a === b,
    onListen: function () {
      var voltage = audioContext.createConstantSource()
      voltage.start()
      voltage.connect(result)
      releases.push(
        Apply(audioContext, target, value),
        () => destroySourceNode(voltage)
      )
    },
    onUnlisten: function () {
      while (releases.length) {
        releases.pop()()
      }
    }
  })
}
