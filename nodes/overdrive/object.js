var Processor = require('lib/processor')

var Param = require('lib/param')
var Transform = require('lib/param-transform')
var Apply = require('lib/apply-param')

module.exports = OverdriveNode

var curve = generateCurve(22050)

function OverdriveNode (context) {
  var input = context.audio.createGain()
  var output = context.audio.createGain()

  var bpWet = context.audio.createGain()
  var bpDry = context.audio.createGain()

  var bandpass = context.audio.createBiquadFilter()
  bandpass.type = 'bandpass'

  var lowpass = context.audio.createBiquadFilter()
  var waveshaper = context.audio.createWaveShaper()
  waveshaper.curve = curve

  input.connect(bpWet)
  input.connect(bpDry)

  bpWet.connect(bandpass)
  bpDry.connect(waveshaper)
  bandpass.connect(waveshaper)
  waveshaper.connect(lowpass)
  lowpass.connect(output)

  var obs = Processor(context, input, output, {
    preBand: Param(context, 0.5),
    color: Param(context, 800),
    postCut: Param(context, 3000),
    gain: Param(context, 1),
    amp: Param(context, 1)
  })

  var invertedPreBand = Transform(context, [ 1,
    { param: obs.preBand, transform: subtract }
  ])

  Apply(context, bpWet.gain, obs.preBand)
  Apply(context, bpDry.gain, invertedPreBand)
  Apply(context, bandpass.frequency, obs.color)
  Apply(context, lowpass.frequency, obs.postCut)
  Apply(context, input.gain, obs.gain)
  Apply(context, output.gain, obs.amp)

  return obs
}

function subtract (a, b) {
  return a - b
}

function generateCurve (steps) {
  var curve = new Float32Array(steps)
  var deg = Math.PI / 180

  for (var i = 0;i < steps;i++) {
    var x = i * 2 / steps - 1
    curve[i] = (3 + 10) * x * 20 * deg / (Math.PI + 10 * Math.abs(x))
  }

  return curve
}
