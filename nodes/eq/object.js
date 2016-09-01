var Processor = require('lib/processor')
var Param = require('audio-slot-param')
var Apply = require('audio-slot-param/apply')
var Transform = require('audio-slot-param/transform')

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

  var obs = Processor(context, lowshelf, highpass, {
    highcut: Param(context, 20000),
    lowcut: Param(context, 20),
    low: Param(context, 0),
    mid: Param(context, 0),
    high: Param(context, 0)
  })

  Apply(context, lowpass.frequency, Transform(context, [
    { param: obs.highcut, transform: clampMin20 }
  ]))

  Apply(context, highpass.frequency, Transform(context, [
    { param: obs.lowcut, transform: clampMin20 }
  ]))

  Apply(context, lowshelf.gain, obs.low)
  Apply(context, peaking.gain, obs.mid)
  Apply(context, highshelf.gain, obs.high)

  return obs
}

function clampMin20 (_, val) {
  return Math.max(20, val)
}
