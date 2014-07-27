var IAC = require('inheritable-audio-context')
var Bopper = require('bopper')

var audioContext = IAC(new AudioContext())
module.exports = audioContext

// set up default clock
var clock = audioContext.scheduler = Bopper(audioContext)
clock.setTempo(120)
clock.start()

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
