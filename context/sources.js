var wrap = require('audio-slot/source')
//var crap = require('audio-slot/constant-source')

module.exports = {
  sample: require('audio-slot/sources/sample'),
  oscillator: require('audio-slot/sources/oscillator'),
  granular: wrap(require('soundbank-granular'))
}

module.exports._spawners = [

  ['Sample', { 
    node: 'source/sample',
    mode: 'oneshot',
    offset: [ 0, 1 ]
  }],

  ['Oscillator', {
    node: 'source/oscillator',
    amp: { node: 'modulator/adsr', value: 0.6, release: 0.01 }
  }], 

  ['Granular', {
    node: 'source/granular',
    mode: 'loop',
    offset: [ 0, 1 ]
  }]
  
]