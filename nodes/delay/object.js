var Processor = require('lib/processor')

var Property = require('lib/property')
var computed = require('mutant/computed')
var Param = require('lib/param')
var Multiply = require('lib/param-multiply')
var Sum = require('lib/param-sum')
var Apply = require('lib/apply-param')

module.exports = DelayNode

function DelayNode (context) {
  var input = context.audio.createGain()
  var output = context.audio.createGain()

  var delay = context.audio.createDelay(4)
  var filter = context.audio.createBiquadFilter()
  filter.Q.value = -3.0102999566398125 // no resonance

  var feedback = context.audio.createGain()
  var dry = context.audio.createGain()
  var wet = context.audio.createGain()

  // feedback loop
  input.connect(filter)
  filter.connect(delay)
  delay.connect(feedback)
  delay.connect(wet)
  feedback.connect(filter)

  input.connect(dry)
  dry.connect(output)
  wet.connect(output)

  var releases = []

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
    Apply(context.audio, delay.delayTime, time),
    Apply(context.audio, filter.frequency, obs.cutoff),
    Apply(context.audio, feedback.gain, obs.feedback),

    obs.filterType(function (value) {
      filter.type = value
    }),

    Apply(context.audio, wet.gain, obs.wet),
    Apply(context.audio, dry.gain, obs.dry)
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
