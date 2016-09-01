var Processor = require('lib/processor')
var Oscillator = require('../oscillator/object')

module.exports = RingModulatorNode

function RingModulatorNode (context) {
  var node = context.audio.createGain()

  var obs = Processor(context, node, node, {
    carrier: Oscillator(context)
  })

  obs.carrier.connect(node.gain)
  return obs
}
