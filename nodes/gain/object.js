var Processor = require('lib/processor')
var Param = require('lib/param')
var Apply = require('lib/apply-param')

module.exports = GainNode

function GainNode (context) {
  var node = context.audio.createGain()
  node.gain.value = 0

  var obs = Processor(context, node, node, {
    gain: Param(context, node.gain.defaultValue)
  })

  Apply(context.audio, node.gain, obs.gain)

  return obs
}
