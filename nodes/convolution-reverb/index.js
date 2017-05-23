module.exports = {
  name: 'Convolution Reverb',
  spawn: false, // can be selected using "reverb" with type option
  node: 'processor/convolution-reverb',
  group: 'processors',
  object: require('./object'),
  render: require('./view')
}
