module.exports = require('loop-grid')
module.exports.launchpad = require('loop-launchpad')
module.exports.mpkmini = require('loop-mpkmini')

module.exports._choices = [
  ['No Controller', 'controller'],
  ['Novation Launchpad', 'controller/launchpad'], 
  ['Akai MPK Mini', 'controller/mpkmini']
]