var wrap = require('audio-slot/processor')
var Bitcrusher = require('bitcrusher')

module.exports = {

  gain: wrap(function(context){ 
    return context.createGain() 
  }),

  filter: wrap(function(context){ 
    return context.createBiquadFilter()
  }),

  bitcrusher: wrap(function(context){
    return Bitcrusher(context, {bufferSize: 256})
  }),

  delay: wrap(require('soundbank-delay')),
  dipper: wrap(require('soundbank-dipper')),
  overdrive: wrap(require('soundbank-overdrive')),
  pitchshift: wrap(require('soundbank-pitch-shift')),
  reverb: wrap(require('soundbank-reverb'))
}

module.exports._spawners = [

  ['Gain', {
    node: 'processor/gain'
  }],

  ['Filter', {
    node:'processor/filter'
  }],

  ['Delay', {
    node: 'processor/delay'
  }],

  ['Reverb', {
    node:'processor/reverb'
  }],

  ['Dipper', {
    node:'processor/dipper'
  }],

  ['Overdrive', {
    node:'processor/overdrive'
  }],

  ['Bitcrusher', {
    node:'processor/bitcrusher'
  }],

  ['Pitchshift', {
    node:'processor/pitchshift'
  }]

]