var audioContext = new webkitAudioContext()
module.exports = audioContext

audioContext.sources = {
  sample: require('soundbank-sample'),
  oscillator: require('soundbank-oscillator')
}

audioContext.providers = {
  inherit: require('soundbank-inherit'),
  scale: require('soundbank-scale'),
  slice: require('soundbank-slice'),
  multi: require('soundbank-multi'),
  range: require('./lib/range')
}

audioContext.modulators = {
  lfo: require('lfo'),
  adsr: require('adsr'),
  slide: require('soundbank-slide')
}

audioContext.processors = {
  gain: audioContext.createGain.bind(audioContext),
  filter: audioContext.createBiquadFilter.bind(audioContext),
  delay: require('soundbank-delay'),
  dipper: require('soundbank-dipper'),
  overdrive: require('soundbank-overdrive'),
  bitcrusher: require('bitcrusher').bind(this, audioContext, {bufferSize: 256}),
  pitchshift: require('soundbank-pitch-shift')
}

audioContext.sampleCache = {}
