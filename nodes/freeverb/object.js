var watch = require('@mmckegg/mutant/watch')

var Freeverb = require('freeverb')
var Processor = require('lib/processor')
var Property = require('lib/property')

var Param = require('lib/param')
var Apply = require('lib/apply-param')
var Multiply = require('lib/param-multiply')

module.exports = FreeverbNode

function FreeverbNode (context) {
  var reverb = Freeverb(context.audio)
  var output = context.audio.createGain()
  reverb.connect(output)

  var releases = []
  var obs = Processor(context, reverb, output, {
    roomSize: Param(context, 0.8),
    dampening: Param(context, 3000),
    wet: Param(context, 1),
    dry: Param(context, 1)
  }, releases)

  releases.push(
    Apply(context.audio, reverb.wet, Multiply([obs.wet, 1 / 4])),
    Apply(context.audio, reverb.dry, obs.dry)
  )

  reverb.combFilters.forEach((combFilter) => {
    releases.push(
      Apply(context.audio, combFilter.resonance, obs.roomSize),
      Apply(context.audio, combFilter.dampening, obs.dampening)
    )
  })

  return obs
}
