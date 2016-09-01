var Processor = require('lib/processor')

var Property = require('observ-default')

var Param = require('lib/param')
var Transform = require('lib/param-transform')
var Apply = require('lib/apply-param')

module.exports = DelayNode

function DelayNode (context) {
  var input = context.audio.createGain()
  var output = context.audio.createGain()

  var delay = context.audio.createDelay(4)
  var filter = context.audio.createBiquadFilter()

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

  var rateMultiplier = Transform(context, [
    { param: obs.sync },
    { param: context.tempo, transform: getRateMultiplier }
  ])

  // release context.tempo
  releases.push(rateMultiplier.destroy)

  var time = Transform(context, [
    { param: obs.time },
    { param: rateMultiplier, transform: multiply }
  ])

  Apply(context, delay.delayTime, time)
  Apply(context, filter.frequency, obs.cutoff)
  Apply(context, feedback.gain, obs.feedback)
  obs.filterType(function (value) {
    filter.type = value
  })

  filter.Q.value = 0

  Apply(context, wet.gain, obs.wet)
  Apply(context, dry.gain, obs.dry)

  return obs
}

function getRateMultiplier (sync, tempo) {
  if (sync) {
    return 60 / tempo
  } else {
    return 1
  }
}

function multiply (a, b) {
  return a * b
}
