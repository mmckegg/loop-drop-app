module.exports = {
  gain: require('audio-slot/processors/gain'),
  filter: require('audio-slot/processors/filter'),
  bitcrusher: require('audio-slot/processors/bitcrusher'),
  delay: require('audio-slot/processors/delay'),
  dipper: require('audio-slot/processors/dipper'),
  overdrive: require('audio-slot/processors/overdrive'),
  pitchshift: require('audio-slot/processors/pitchshift'),
  reverb: require('audio-slot/processors/reverb')
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