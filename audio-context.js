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
  multi: require('soundbank-multi')
}

audioContext.modulators = {
  lfo: require('lfo'),
  adsr: require('adsr')
}

audioContext.processors = {
  gain: audioContext.createGain.bind(audioContext),
  filter: audioContext.createBiquadFilter.bind(audioContext),
  delay: require('soundbank-delay'),
  dipper: require('soundbank-dipper'),
  overdrive: require('soundbank-overdrive')
}

audioContext.sampleCache = {}
