// FROM: https://raw.githubusercontent.com/itsjoesullivan/snare/master/index.js
var NoiseBuffer = require('noise-buffer');
var noiseBuffer = NoiseBuffer(1);

module.exports = function(context, parameters) {

  parameters = parameters || {};
  parameters.tune = typeof parameters.tune === 'number' ? parameters.tune : 64
  parameters.tone = typeof parameters.tone === 'number' ? parameters.tone : 64
  parameters.snappy = typeof parameters.snappy === 'number' ? parameters.snappy : 64;
  parameters.decay = typeof parameters.decay === 'number' ? parameters.decay : 64;


  return function() {
    var transpose = Math.pow(2, (parameters.tune - 64) / 1200);

    var audioNode = context.createGain();
    var masterBus = context.createGain();
    masterBus.gain.value = 0.4;
    var masterHighBump = context.createBiquadFilter();
    masterHighBump.type = "peaking";
    var masterLowBump = context.createBiquadFilter();
    masterLowBump.type = "peaking";
    masterBus.connect(masterHighBump);
    masterHighBump.connect(masterLowBump);
    masterLowBump.connect(audioNode);
    masterHighBump.frequency.value = 4000;
    masterLowBump.frequency.value = 200;
    masterHighBump.gain.value = 6;
    masterLowBump.gain.value = 12;

    var noise = context.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    var noiseGain = context.createGain();
    var noiseHighpass = context.createBiquadFilter();
    noiseHighpass.type = "highpass";
    noise.connect(noiseGain);
    noiseGain.connect(noiseHighpass);
    noiseHighpass.connect(masterBus);
    noiseHighpass.frequency.value = 1200;

    var oscsGain = context.createGain();
    var oscsHighpass = context.createBiquadFilter();
    oscsGain.connect(oscsHighpass);
    oscsHighpass.type = "highpass";
    oscsHighpass.frequency.value = 400;
    oscsHighpass.connect(masterBus);

    var max = 2.2;
    var min = 0.09;
    var duration = (max - min) * (parameters.decay / 127) + min;

    var oscs = [87.307, 329.628].map(function(frequency) {
      var osc = context.createOscillator();
      osc.frequency.value = frequency * transpose;
      osc.connect(oscsGain);
      return osc;
    });

    audioNode.start = function(when) {
      if (typeof when !== "number") {
        when = context.currentTime;
      }

      noiseGain.gain.setValueAtTime(0.00001, when);
      noiseGain.gain.exponentialRampToValueAtTime(Math.max(0.000001, parameters.snappy / 127), when + 0.005);
      noiseGain.gain.exponentialRampToValueAtTime(0.00001, when + 0.1 + duration);
      noise.start(when);

      oscsGain.gain.setValueAtTime(0.00001, when);
      oscsGain.gain.exponentialRampToValueAtTime(2 * Math.max((parameters.tone / 127), 0.0001), when + 0.005);
      oscsGain.gain.exponentialRampToValueAtTime(0.00001, when + duration);

      oscs.forEach(function(osc) {
        osc.start(when);
      });
    };
    audioNode.stop = function(when) {
      noise.stop(when);
    };
    return audioNode;
  };
};
