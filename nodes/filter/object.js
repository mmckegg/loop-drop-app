var Processor = require('lib/processor')
var Property = require('lib/property')
var Param = require('lib/param')
var Apply = require('lib/apply-param')
var Clamp = require('lib/param-clamp')

module.exports = FilterNode

function FilterNode (context) {
  var node = context.audio.createBiquadFilter()

  var releases = []
  var obs = Processor(context, node, node, {
    frequency: Param(context, node.frequency.defaultValue),
    Q: Param(context, node.Q.defaultValue),
    gain: Param(context, node.gain.defaultValue),
    type: Property(node.type)
  }, releases)

  obs.type(function (value) {
    node.type = value
  })

  releases.push(
    Apply(context.audio, node.frequency, Clamp(obs.frequency, 20, 20000)),
    Apply(context.audio, node.Q, obs.Q),
    Apply(context.audio, node.gain, obs.gain)
  )

  return obs
}
