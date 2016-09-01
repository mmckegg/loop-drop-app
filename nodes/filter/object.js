var Processor = require('lib/processor')
var Property = require('observ-default')
var Param = require('audio-slot-param')
var Apply = require('audio-slot-param/apply')
var Transform = require('audio-slot-param/transform')

module.exports = FilterNode

function FilterNode (context) {
  var node = context.audio.createBiquadFilter()

  var obs = Processor(context, node, node, {
    frequency: Param(context, node.frequency.defaultValue),
    Q: Param(context, node.Q.defaultValue),
    gain: Param(context, node.gain.defaultValue),
    type: Property(node.type)
  })

  obs.type(function (value) {
    node.type = value
  })

  Apply(context, node.frequency, Transform(context, [
    { param: obs.frequency, transform: clampMin20 }
  ]))
  Apply(context, node.Q, obs.Q)
  Apply(context, node.gain, obs.gain)

  return obs
}

function clampMin20 (_, val) {
  return Math.max(20, val)
}
