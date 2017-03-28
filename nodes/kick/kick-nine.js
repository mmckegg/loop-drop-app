// FROM: https://raw.githubusercontent.com/itsjoesullivan/kick-nine/master/index.js
var NoiseBuffer = require('noise-buffer');
var makeDistortionCurve = require('make-distortion-curve');
var distortionCurve = makeDistortionCurve(2)

module.exports = function(context, parameters) {

  parameters = parameters || {};
  parameters.tone = typeof parameters.tone === 'number' ? parameters.tone : 64;
  parameters.decay = typeof parameters.decay === 'number' ? parameters.decay : 64;
  parameters.tune = typeof parameters.tune === 'number' ? parameters.tune : 64

  var noiseBuffer = NoiseBuffer(0.2)
  var lastNode;

  return function() {
    var node = context.createGain();
    var transpose = Math.pow(2, (parameters.tune - 64) / 1200)

    var osc = context.createOscillator();
    osc.type = "sine";
    osc.connect(node);

    var distortion = context.createWaveShaper();
    distortion.curve = distortionCurve;
    distortion.oversample = '4x';

    osc.connect(distortion);
    distortion.connect(node);

    var noiseSource = context.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    var noiseLowpass = context.createBiquadFilter();
    noiseLowpass.type = "lowpass";
    noiseLowpass.frequency.value = 1000;

    var max = 2.2;
    var min = 0.09;
    var duration = (max - min) * (parameters.decay / 127) + min;

    var noisePath = context.createGain();
    noisePath.connect(node);
    noiseSource.connect(noiseLowpass);
    noiseLowpass.connect(noisePath);

    node.start = function(when) {
      if (typeof when !== 'number') {
        when = context.currentTime;
      }
      if (lastNode && lastNode.stop && lastNode !== node) {
        lastNode.stop(when);
      }
      lastNode = node;
      node.gain.setValueAtTime(1, when);
      node.gain.exponentialRampToValueAtTime(0.0001, when + duration)

      osc.start(when);
      osc.frequency.setValueAtTime(200 * transpose, when);
      osc.frequency.exponentialRampToValueAtTime(55 * transpose, when + 0.1);
      osc.stop(when + duration);

      noiseSource.start(when);
      noisePath.gain.setValueAtTime(2 * Math.max((parameters.tone / 127), 0.0001), when);
      noisePath.gain.setTargetAtTime(0, when, 0.003);
    };
    node.stop = function(when) {
      if (typeof when !== 'number') {
        when = context.currentTime;
      }
      osc.stop(when);
    };
    return node;
  };

};
