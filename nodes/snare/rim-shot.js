// FROM: https://raw.githubusercontent.com/itsjoesullivan/rim-shot/master/index.js
var makeDistortionCurve = require('make-distortion-curve');
var curve = makeDistortionCurve(1024);


// partially informed by the rather odd http://www.kvraudio.com/forum/viewtopic.php?t=383536
module.exports = function(context, parameters) {

  parameters = parameters || {};
  parameters.tune = typeof parameters.tune === 'number' ? parameters.tune : 64;
  parameters.decay = typeof parameters.decay === 'number' ? parameters.decay : 64;

  return function() {

    var transpose = Math.pow(2, (parameters.tune - 64) / 1200);
    var max = 2.2;
    var min = 0.0001;
    var duration = (max - min) * (parameters.decay / 127) + min;

    var distortion = context.createWaveShaper();
    distortion.curve = curve;

    var highpass = context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 700;

    distortion.connect(highpass);

    var oscs = [
      context.createOscillator(),
      context.createOscillator(),
    ];
    oscs.forEach(function(osc) {
      osc.type = "triangle";
    });
    oscs[0].frequency.value = 500 * transpose;
    oscs[1].frequency.value = 1720 * transpose;

    var gain = context.createGain();

    oscs.forEach(function(osc) {
      osc.connect(distortion);
    });
    highpass.connect(gain);
    gain.start = function(when) {
      oscs.forEach(function(osc) {
        osc.start(when);
        osc.stop(when + duration);
      });
      gain.gain.setValueAtTime(0.8, when);
      gain.gain.exponentialRampToValueAtTime(0.00001, when + duration);
    }

    gain.stop = function (when) {
      oscs.forEach(function(osc) {
        osc.stop(when);
      });
    }
    return gain;
  };
};
