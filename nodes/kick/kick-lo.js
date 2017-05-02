module.exports = Kick

// TODO: remove weird wrapper and implement directly

function Kick (context, parameters) {

  parameters = parameters || {};
  parameters.tone = typeof parameters.tone === 'number' ? parameters.tone : 64
  parameters.decay = typeof parameters.decay === 'number' ? parameters.decay : 64
  parameters.tune = typeof parameters.tune === 'number' ? parameters.tune : 64

  var max = 2.2;
  var min = 0.09;
  return function () {
    var node = context.createGain()
    var osc = context.createOscillator()
    var gain = context.createGain()

    var release = (max - min) * (parameters.decay / 127) + min
    var attack = Math.max((parameters.tone / 127), 0.01) * 0.2
    var octave = 1 + (Math.max((parameters.tone / 127), 0) * 6)
    var pitch = 60 * Math.pow(2, (parameters.tune - 64) / 1200)

    gain.gain.value = 0
    osc.connect(gain)
    gain.connect(node)

    node.start = function (time) {
      var softness = 1
      osc.frequency.setValueAtTime(pitch * octave, time)
      gain.gain.setValueAtTime(0, time)
      gain.gain.linearRampToValueAtTime(1, time + (softness / 1000))
      osc.frequency.exponentialRampToValueAtTime(pitch, time + attack)
      gain.gain.exponentialRampToValueAtTime(0.5, time + attack)
      gain.gain.setTargetAtTime(0, time + attack, release / 8)
      osc.frequency.setTargetAtTime(pitch / 3, time + attack, 1)

      // HACK: clean up hanging targets
      gain.gain.setValueAtTime(0, time + attack + release)
      osc.frequency.setValueAtTime(pitch / 3, time + attack + 8)

      osc.start(time)
      osc.stop(time + attack + release)
      return time + attack + release
    }

    node.stop = function(when) {
      osc.stop(when)
    }

    return node
  }
}
