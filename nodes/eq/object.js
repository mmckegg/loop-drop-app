var Processor = require('lib/processor')
var Param = require('lib/param')
var Apply = require('lib/apply-param')
var Clamp = require('lib/param-clamp')

module.exports = EQNode

function EQNode (context) {
  var lowshelf = context.audio.createBiquadFilter()
  lowshelf.type = 'lowshelf'
  lowshelf.frequency = 320

  var peaking = context.audio.createBiquadFilter()
  peaking.type = 'peaking'
  peaking.frequency = 1000
  peaking.Q = 0.5

  var highshelf = context.audio.createBiquadFilter()
  highshelf.type = 'highshelf'
  lowshelf.frequency = 3200

  var lowpass = context.audio.createBiquadFilter()
  lowpass.type = 'lowpass'

  var highpass = context.audio.createBiquadFilter()
  highpass.type = 'highpass'

  // chain
  lowshelf.connect(peaking)
  peaking.connect(highshelf)
  highshelf.connect(lowpass)
  lowpass.connect(highpass)

  var releases = []
  var obs = Processor(context, lowshelf, highpass, {
    highcut: Param(context, 20000),
    lowcut: Param(context, 20),
    low: Param(context, 0),
    mid: Param(context, 0),
    high: Param(context, 0)
  }, releases)

  releases.push(
    Apply(context.audio, lowpass.frequency, Clamp(obs.highcut, 20, 20000)),
    Apply(context.audio, highpass.frequency, Clamp(obs.lowcut, 20, 20000)),
    Apply(context.audio, lowshelf.gain, obs.low),
    Apply(context.audio, peaking.gain, obs.mid),
    Apply(context.audio, highshelf.gain, obs.high)
  )

  return obs
}
