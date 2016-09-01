var watch = require('@mmckegg/mutant/watch')

var Freeverb = require('freeverb')
var Processor = require('lib/processor')
var Property = require('observ-default')

var Param = require('audio-slot-param')
var Apply = require('audio-slot-param/apply')
var Transform = require('audio-slot-param/transform')

module.exports = FreeverbNode

function FreeverbNode (context) {
  var reverb = Freeverb(context.audio)
  var output = context.audio.createGain()
  reverb.connect(output)

  var obs = Processor(context, reverb, output, {
    roomSize: Property(0.8),
    dampening: Property(3000),
    wet: Param(context, 1),
    dry: Param(context, 1)
  })

  watch(obs.roomSize, function (value) {
    reverb.roomSize = Math.min(1, Math.max(0, value))
  })

  watch(obs.dampening, function (value) {
    reverb.dampening = Math.min(20000, Math.max(0, value))
  })

  Apply(context, reverb.wet, Transform(context, [
    obs.wet, { value: 4, transform: divide }
  ]))
  Apply(context, reverb.dry, obs.dry)

  return obs
}

function divide (a, b) {
  return a / b
}
