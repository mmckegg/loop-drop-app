module.exports = {
  name: 'Freeverb',
  spawn: false, // can be selected using "reverb" with type option
  node: 'processor/freeverb',
  group: 'processors',
  object: require('./object'),
  render: require('./view')
}
