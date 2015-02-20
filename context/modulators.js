var wrap = require('audio-slot/source')

module.exports = {
  lfo: wrap(require('lfo')),
  adsr: require('audio-slot/envelope') //wrap(require('adsr'))
}

module.exports._spawners = [

  ['LFO', {
    node: 'modulator/lfo'
  }],

  ['ENV', {
    node: 'modulator/adsr',
    release: 0.1
  }]

]