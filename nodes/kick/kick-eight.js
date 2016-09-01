// FROM: https://raw.githubusercontent.com/itsjoesullivan/kick-eight/master/index.js
var NoiseBuffer = require('noise-buffer');

module.exports = function(context, parameters) {

  parameters = parameters || {};
  parameters.tone = typeof parameters.tone === 'number' ? parameters.tone : 64;
  parameters.decay = typeof parameters.decay === 'number' ? parameters.decay : 64;
  parameters.tune = typeof parameters.tune === 'number' ? parameters.tune : 64

  var noiseBuffer = NoiseBuffer(1);

  return function() {
    var osc = context.createOscillator();
    osc.frequency.value = 54 * Math.pow(2, (parameters.tune - 64) / 1200);
    var gain = context.createGain();
    var oscGain = context.createGain();
    oscGain.connect(gain);
    osc.connect(oscGain);

    var max = 2.2;
    var min = 0.09;
    var duration = (max - min) * (parameters.decay / 127) + min;

    var noise = context.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    var noiseGain = context.createGain();
    var noiseFilter = context.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 1380 * 2;
    noiseFilter.Q.value = 20;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gain);


    gain.start = function(when) {
      if (typeof when !== 'number') {
        when = context.currentTime;
      }
      noise.start(when);

      noiseGain.gain.setValueAtTime(2 * Math.max((parameters.tone / 127), 0.0001), when);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.01);
      noise.stop(when + duration);

      osc.start(when);
      osc.stop(when + duration);

      oscGain.gain.setValueAtTime(0.0001, when);
      oscGain.gain.exponentialRampToValueAtTime(1, when + 0.004);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    };

    gain.stop = function(when) {
      if (typeof when !== 'number') {
        when = context.currentTime;
      }
    };

    return gain;
  };
};
