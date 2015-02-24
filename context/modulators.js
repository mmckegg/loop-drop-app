var wrap = require('audio-slot/source')

module.exports = {
  lfo: wrap(require('lfo')),
  adsr: require('audio-slot/modulators/envelope'), //wrap(require('adsr'))
  param: require('audio-slot/modulators/param'),
  scale: require('audio-slot/modulators/scale')
}