var Processor = require('lib/processor')
var Property = require('lib/property')
var Param = require('lib/param')
var Multiply = require('lib/param-multiply')
var Apply = require('lib/apply-param')
var computed = require('mutant/computed')
var Sum = require('lib/param-sum')

module.exports = PingPongDelayNode

function PingPongDelayNode (context) {
  var input = context.audio.createGain()
  var output = context.audio.createGain()

  var delayL = context.audio.createDelay(4)
  var delayR = context.audio.createDelay(4)

  var filter = context.audio.createBiquadFilter()
  filter.Q.value = 0

  var feedback = context.audio.createGain()
  var dry = context.audio.createGain()
  var wet = context.audio.createGain()
  var releases = []

  // feedback loop
  input.connect(filter)
  filter.connect(delayL)
  delayL.connect(delayR)
  delayR.connect(feedback)
  feedback.connect(filter)

  // wet
  var merger = context.audio.createChannelMerger(2)
  delayL.connect(merger, 0, 0)
  delayR.connect(merger, 0, 1)
  merger.connect(wet)
  wet.connect(output)

  input.connect(dry)
  dry.connect(output)

  var obs = Processor(context, input, output, {
    time: Param(context, 0.25),
    sync: Property(false),

    feedback: Param(context, 0.6),
    cutoff: Param(context, 20000),
    filterType: Property('lowpass'),

    wet: Param(context, 1),
    dry: Param(context, 1)
  }, releases)

  var rateMultiplier = computed([obs.sync, context.tempo], getRateMultiplier)
  var time = Multiply([obs.time, rateMultiplier])

  releases.push(
    Apply(context.audio, delayL.delayTime, time),
    Apply(context.audio, delayR.delayTime, time),
    Apply(context.audio, filter.frequency, obs.cutoff),
    Apply(context.audio, feedback.gain, obs.feedback),
    Apply(context.audio, wet.gain, obs.wet),
    Apply(context.audio, dry.gain, obs.dry),
    obs.filterType(function (value) {
      filter.type = value
    })
  )

  return obs
}

function getRateMultiplier (sync, tempo) {
  if (sync) {
    return 60 / tempo
  } else {
    return 1
  }
}
