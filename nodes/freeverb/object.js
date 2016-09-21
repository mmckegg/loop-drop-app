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
    roomSize: Property(0.8),
    dampening: Property(3000),
    wet: Param(context, 1),
    dry: Param(context, 1)
  }, releases)

  releases.push(
    watch(obs.roomSize, function (value) {
      reverb.roomSize = Math.min(1, Math.max(0, value))
    }),

    watch(obs.dampening, function (value) {
      reverb.dampening = Math.min(20000, Math.max(0, value))
    }),

    Apply(context.audio, reverb.wet, Multiply([obs.wet, 1 / 4])),
    Apply(context.audio, reverb.dry, obs.dry)
  )

  return obs
}
