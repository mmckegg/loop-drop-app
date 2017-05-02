// FROM: https://github.com/chrislo/drum_synthesis/blob/gh-pages/javascripts/drums.js
var NoiseBuffer = require('noise-buffer');
var noiseBuffer = NoiseBuffer(1);

module.exports = function(context, parameters) {
  parameters = parameters || {}
  parameters.tune = typeof parameters.tune === 'number' ? parameters.tune : 64
  parameters.tone = typeof parameters.tone === 'number' ? parameters.tone : 64
  parameters.snappy = typeof parameters.snappy === 'number' ? parameters.snappy : 64
  parameters.decay = typeof parameters.decay === 'number' ? parameters.decay : 64

  return function () {
    var transpose = Math.pow(2, (parameters.tune - 64) / 1200)

    var max = 2.2
    var min = 0.09
    var duration = (max - min) * (parameters.decay / 127) + min + 0.2

    var audioNode = context.createGain()
    var noise = context.createBufferSource()
    noise.loop = true
    noise.buffer = noiseBuffer

    var noiseFilter = context.createBiquadFilter()
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.value = 1000
    noise.connect(noiseFilter)

    var noiseEnvelope = context.createGain()
    noiseFilter.connect(noiseEnvelope)

    noiseEnvelope.connect(audioNode)

    var osc = context.createOscillator()
    osc.frequency.value = 100 * transpose
    osc.type = 'triangle'

    var oscEnvelope = context.createGain()
    osc.connect(oscEnvelope)
    oscEnvelope.connect(audioNode)

    audioNode.start = function (time) {
      if (typeof time !== 'number') {
        time = context.currentTime
      }
      noiseEnvelope.gain.setValueAtTime(Math.max(0.000001, parameters.snappy / 127), time)
      noiseEnvelope.gain.exponentialRampToValueAtTime(0.001, time + duration)
      noise.start(time)

      oscEnvelope.gain.setValueAtTime(2 * Math.max((parameters.tone / 127), 0.0001), time)
      oscEnvelope.gain.exponentialRampToValueAtTime(0.3, time + 0.1)
      oscEnvelope.gain.setTargetAtTime(0, time + 0.1, duration / 8)
      osc.start(time)
      audioNode.gain.setTargetAtTime(0, time, duration / 8)

      osc.stop(time + duration)
      noise.stop(time + duration)
      return time + duration
    }

    audioNode.stop = function (when) {
      osc.stop(when)
      noise.stop(when)
    }

    return audioNode
  }
}
