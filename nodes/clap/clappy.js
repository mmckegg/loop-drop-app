// FROM: https://raw.githubusercontent.com/itsjoesullivan/clappy/master/index.js
var NoiseBuffer = require('noise-buffer');
var buffer = NoiseBuffer(1);

module.exports = function(context, parameters) {

  parameters = parameters || {};
  parameters.decay = typeof parameters.decay === 'number' ? parameters.decay : 64;
  parameters.tone = typeof parameters.tone === 'number' ? parameters.tone : 64
  parameters.density = typeof parameters.density === 'number' ? parameters.density : 20

  return function() {
    var transpose = Math.pow(2, (parameters.tone - 64) / 32);
    var max = 2.2;
    var min = 0.0001;
    var duration = (max - min) * (parameters.decay / 128) + min;
    var maxCycles = 10
    var minCycles = 1
    var cycles = (maxCycles - minCycles) * (parameters.density / 128) + minCycles;
    var clapFrequency = 80 * transpose;
    var clapLength = cycles / clapFrequency;

    var bandpass = context.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.value = 800 * transpose;
    bandpass.Q.value = 0.7;

    var highpass = context.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 600;
    bandpass.connect(highpass);

    /*
      All this does is feed white noise
      through two paths: one short burst
      that goes through an envelope mod-
      ified by an LFO at 80hz, simulat-
      ing a few rapid claps, and a long-
      er burst that simulates the rever-
      beration of the claps through the
      room.
    */


    var audioNode = context.createGain();
    audioNode.gain.value = 2;

    var noise = context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    var clapDryEnvelope = context.createGain();
    clapDryEnvelope.gain.value = 0;

    var clapDecayEnvelope = context.createGain();
    clapDecayEnvelope.gain.value = 0;

    var lfoCarrier = context.createGain();
    var lfo = context.createOscillator();
    lfo.type = "sawtooth";
    lfo.frequency.value = -clapFrequency;
    lfo.connect(lfoCarrier.gain);


    noise.connect(clapDryEnvelope);
    clapDryEnvelope.connect(lfoCarrier);
    lfoCarrier.connect(bandpass);

    noise.connect(clapDecayEnvelope);
    clapDecayEnvelope.connect(bandpass);

    highpass.connect(audioNode);

    audioNode.start = function(when) {

      clapDryEnvelope.gain.setValueAtTime(0.0001, when);
      clapDryEnvelope.gain.exponentialRampToValueAtTime(1, when + 0.001);
      clapDryEnvelope.gain.linearRampToValueAtTime(1, when + clapLength);
      clapDryEnvelope.gain.exponentialRampToValueAtTime(0.000000001, when + clapLength + 0.01);
      clapDryEnvelope.gain.setValueAtTime(0, when + clapLength + 0.02);

      clapDecayEnvelope.gain.setValueAtTime(0.0001, when);
      clapDecayEnvelope.gain.setValueAtTime(0.0001, when + clapLength);
      clapDecayEnvelope.gain.exponentialRampToValueAtTime(1, when + clapLength + 0.001);
      clapDecayEnvelope.gain.exponentialRampToValueAtTime(0.2, when + 0.1);
      clapDecayEnvelope.gain.exponentialRampToValueAtTime(0.000000001, when + duration);
      clapDecayEnvelope.gain.setValueAtTime(0, when + duration + 0.01);

      lfo.start(when);
      lfo.stop(when + duration);
      noise.start(when, Math.random() * noise.buffer.duration);
      noise.stop(when + duration);
      audioNode.gain.setValueAtTime(0, when + duration);
    };

    audioNode.stop = function(when) {
      try {
        lfo.stop(when);
      } catch(e) {
        // likely already stopped
      }
      try {
        noise.stop(when);
      } catch(e) {
        // likely already stopped
      }
    };

    return audioNode;
  };
};
