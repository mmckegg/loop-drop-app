var computed = require('@mmckegg/mutant/computed')
var Property = require('lib/property')

var Param = require('lib/param')
var Apply = require('lib/apply-param')
var Triggerable = require('lib/triggerable')
var ScheduleEvent = require('lib/schedule-event')

module.exports = NoiseNode

function NoiseNode (context) {
  var output = context.audio.createGain()
  var amp = context.audio.createGain()
  amp.gain.value = 0
  amp.connect(output)

  var releases = []
  var obs = Triggerable(context, {
    type: Property('white'),
    stereo: Property(false),
    amp: Param(context, 0.4)
  }, trigger, releases)

  obs.buffer = computed([obs.type, obs.stereo], function (type, stereo) {
    if (type === 'pink') {
      return generatePinkNoise(context.audio, 4096 * 4, stereo ? 2 : 1)
    } else {
      return generateWhiteNoise(context.audio, 4096 * 4, stereo ? 2 : 1)
    }
  })

  obs.context = context

  releases.push(
    Apply(context.audio, amp.gain, obs.amp)
  )

  obs.connect = output.connect.bind(output)
  obs.disconnect = output.disconnect.bind(output)

  return obs

  // scoped
  function trigger (at) {
    var buffer = obs.buffer()

    if (buffer instanceof window.AudioBuffer) {
      var choker = context.audio.createGain()
      var player = context.audio.createBufferSource()
      player.connect(choker)
      choker.connect(amp)

      player.buffer = buffer
      player.loop = true
      player.start(at, 0)

      return new ScheduleEvent(at, player, choker)
    }
  }
}

function generateWhiteNoise (audioContext, length, channels) {
  var buffer = audioContext.createBuffer(channels, length, audioContext.sampleRate)
  for (var i = 0;i < length;i++) {
    for (var j = 0;j < channels;j++) {
      buffer.getChannelData(j)[i] = Math.random() * 2 - 1
    }
  }
  return buffer
}

function generatePinkNoise (audioContext, length) {
  // TODO: support multichannel

  var b0, b1, b2, b3, b4, b5, b6
  b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0
  var buffer = audioContext.createBuffer(1, length, audioContext.sampleRate)
  var output = buffer.getChannelData(0)

  for (var i = 0;i < length;i++) {
    var white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.96900 * b2 + white * 0.1538520
    b3 = 0.86650 * b3 + white * 0.3104856
    b4 = 0.55000 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.0168980
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
    output[i] *= 0.11 // (roughly) compensate for gain
    b6 = white * 0.115926
  }

  return buffer
}
