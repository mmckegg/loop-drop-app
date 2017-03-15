var Processor = require('lib/processor')
var Param = require('lib/param')
var Apply = require('lib/apply-param')

module.exports = PanNode

function PanNode (context) {
  var panner = context.audio.createStereoPanner()

  var releases = []
  var obs = Processor(context, panner, panner, {
    offset: Param(context, panner.pan.defaultValue)
  }, releases)

  releases.push(
    Apply(context.audio, panner.pan, obs.offset)
  )

  return obs
}
