var Processor = require('lib/processor')
var Param = require('lib/param')
var Apply = require('lib/apply-param')

module.exports = CompressorNode

function CompressorNode (context) {
  var node = context.audio.createDynamicsCompressor()
  node.ratio.value = 20
  node.threshold.value = -1

  var releases = []
  var obs = Processor(context, node, node, {
    threshold: Param(context, node.threshold.defaultValue),
    knee: Param(context, node.knee.defaultValue),
    ratio: Param(context, node.ratio.defaultValue),
    attack: Param(context, node.attack.defaultValue),
    release: Param(context, node.release.defaultValue)
  }, releases)

  releases.push(
    Apply(context.audio, node.threshold, obs.threshold),
    Apply(context.audio, node.knee, obs.knee),
    Apply(context.audio, node.ratio, obs.ratio),
    Apply(context.audio, node.attack, obs.attack),
    Apply(context.audio, node.release, obs.release)
  )

  return obs
}
