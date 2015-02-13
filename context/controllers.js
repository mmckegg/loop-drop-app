module.exports = {
  qwerty: require('loop-qwerty'),
  launchpad: require('loop-launchpad')//,
  //mpkmin: require('loop-mpkmini'),
  //apcmini: require('loop-apcmini')
}

module.exports._choices = [
  ['Qwerty Keyboard', 'controller/qwerty'], 
  ['Novation Launchpad', 'controller/launchpad']//,
  //['Akai APC Mini', 'controller/apcmini'],
  //['Akai MPK Mini', 'controller/mpkmini']
]

module.exports._spawners = [

  ['MIDI Controller', {
    node: 'controller/launchpad'
  }],

  ['Qwerty Keys', {
    node: 'controller/qwerty'
  }]

]