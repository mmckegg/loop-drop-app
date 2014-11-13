module.exports = require('loop-grid')
module.exports.qwerty = require('loop-qwerty')
module.exports.launchpad = require('loop-launchpad')
module.exports.mpkmini = require('loop-mpkmini')
module.exports.apcmini = require('loop-apcmini')

module.exports._choices = [
  ['No Controller', 'controller'],
  ['Qwerty Keyboard', 'controller/qwerty'], 
  ['Novation Launchpad', 'controller/launchpad'],
  ['Akai APC Mini', 'controller/apcmini'],
  ['Akai MPK Mini', 'controller/mpkmini']
]