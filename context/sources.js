var wrap = require('audio-slot/source')

module.exports = {
  sample: wrap(require('soundbank-sample')),
  oscillator: wrap(require('soundbank-oscillator')),
  granular: wrap(require('soundbank-granular'))
}

module.exports._spawners = [

  ['Sample', { 
    node: 'source/sample',
    offset: [ 0, 1 ]
  }],

  ['Oscillator', {
    node: 'source/oscillator',
    amp: { node: 'modulator/adsr', value: 0.6, release: 0.01 },
    note: 60
  }], 

  ['Granular', {
    node: 'source/granular'
  }]
  
]