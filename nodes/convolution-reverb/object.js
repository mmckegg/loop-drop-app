var Processor = require('lib/processor')
var Param = require('lib/param')
var Apply = require('lib/apply-param')

module.exports = ReverbNode

function ReverbNode (context) {
  var input = context.audio.createGain()
  var output = context.audio.createGain()

  var convolver = context.audio.createConvolver(4)
  var dry = context.audio.createGain()
  var wet = context.audio.createGain()

  input.connect(dry)
  input.connect(convolver)
  convolver.connect(wet)
  dry.connect(output)
  wet.connect(output)

  var releases = []
  var obs = Processor(context, input, output, {
    buffer: Param(context),
    wet: Param(context, 1),
    dry: Param(context, 0)
  }, releases)

  releases.push(
    obs.buffer.currentValue(v => { convolver.buffer = v }),
    Apply(context.audio, wet.gain, obs.wet),
    Apply(context.audio, dry.gain, obs.dry)
  )

  return obs
}
