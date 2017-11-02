var Triggerable = require('lib/triggerable')
var Param = require('lib/param')
var Property = require('lib/property')
var Multiply = require('lib/param-multiply')
var Sum = require('lib/param-sum')
var Apply = require('lib/apply-param')
var ParamClamp = require('lib/param-clamp')
var ScheduleEvent = require('lib/schedule-event')
var watch = require('mutant/watch')

var pulseCurve = new Float32Array(256)
for (var i = 0; i < 128; i++) {
  pulseCurve[i] = -1
  pulseCurve[i + 128] = 1
}

module.exports = OscillatorPulseNode

function OscillatorPulseNode (context) {
  var output = context.audio.createGain()
  var amp = context.audio.createGain()

  var lastEvent = null
  amp.gain.value = 0
  amp.connect(output)

  var releases = []
  var obs = Triggerable(context, {
    amp: Param(context, 1),
    frequency: Param(context, 440),
    noteOffset: Param(context, 0),
    octave: Param(context, 0),
    detune: Param(context, 0),
    pulseWidth: Param(context, 0)
  }, trigger, releases)

  obs.context = context

  var detune = Sum([
    toCents(context.noteOffset),
    toCents(obs.noteOffset),
    Multiply([obs.octave, 1200]),
    obs.detune
  ])

  var powerRolloff = Sum([ // TODO: improve this value?
    Multiply([detune, -1 / 12800]),
    0.5
  ])

  releases.push(
    watch(detune), // HACK: stop detune from regenerating on every trigger
    Apply(context.audio, amp.gain, ParamClamp(obs.amp, 0, 10))
  )

  obs.connect = output.connect.bind(output)
  obs.disconnect = output.disconnect.bind(output)

  return obs

  // scoped
  function trigger (at) {
    // generate aliased pulse wave
    var oscillator = context.audio.createOscillator()
    var pulseShaper = context.audio.createWaveShaper()
    var width = context.audio.createConstantSource()
    var power = context.audio.createGain()
    var choker = context.audio.createGain()

    oscillator.type = 'sawtooth'
    pulseShaper.curve = pulseCurve
    width.offset.value = 0

    oscillator.connect(pulseShaper)
    width.connect(pulseShaper)
    pulseShaper.connect(power)
    power.connect(choker)
    choker.connect(amp)

    lastEvent = new ScheduleEvent(at, oscillator, choker, [
      Apply(context.audio, power.gain, powerRolloff, at),
      Apply(context.audio, oscillator.detune, detune, at),
      Apply(context.audio, width.offset, obs.pulseWidth, at),
      Apply(context.audio, oscillator.frequency, obs.frequency, at),
      () => width.stop()
    ])
    oscillator.start(at)
    width.start(at)
    lastEvent.reuse = true
    return lastEvent
  }
}

function toCents (param) {
  return Multiply([param, 100])
}
