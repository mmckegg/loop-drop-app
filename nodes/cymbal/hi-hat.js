// FROM: https://raw.githubusercontent.com/itsjoesullivan/hi-hat/master/index.js
module.exports = function(context, parameters) {

  parameters = parameters || {};
  parameters.tune = typeof parameters.tune === 'number' ? parameters.tune : 64
  parameters.decay = typeof parameters.decay === 'number' ? parameters.decay : 64;

  return function() {
    var audioNode = context.createGain();

    var currentlyPlayingNodes = [];

    var max = 2.2;
    var min = 0.0001;
    var duration = (max - min) * (parameters.decay / 128) + min;
    var transpose = Math.pow(2, (parameters.tune - 64) / 1200);
    var fundamental = 40;
    var ratios = [2, 3, 4.16, 5.43, 6.79, 8.21];

    // Highpass
    var highpass = context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 7000;

    // Bandpass
    var bandpass = context.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 10000;
    bandpass.connect(highpass);

    var gain = context.createGain();
    gain.gain.value = 0;

    gain.connect(bandpass);
    highpass.connect(audioNode);

    // Create the oscillators
    var oscs = ratios.map(function(ratio) {
      var osc = context.createOscillator();
      osc.type = "square";
      // Frequency is the fundamental * this oscillator's ratio
      osc.frequency.value = fundamental * ratio * transpose;
      osc.connect(gain);
      return osc;
    });

    audioNode.start = function(when) {
      currentlyPlayingNodes.forEach(function(node) {
        node.stop(when + 0.1);
      });
      currentlyPlayingNodes = [];
      currentlyPlayingNodes.push(audioNode);
      if (typeof when !== "number") {
        when = context.currentTime;
      }
      oscs.forEach(function(osc) {
        osc.start(when);
        osc.stop(when + 0.01 + duration);
      });
      // Define the volume envelope
      gain.gain.setValueAtTime(0.00001, when);
      gain.gain.exponentialRampToValueAtTime(1, when + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.3, when + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.00001, when + duration);
      gain.gain.setValueAtTime(0, when + 0.01 + duration);
    };
    audioNode.stop = function(when) {
      oscs.forEach(function(osc) {
        osc.stop(when);
      });
    };
    return audioNode;
  };
};
