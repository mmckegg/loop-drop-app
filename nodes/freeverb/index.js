module.exports = {
  name: 'Freeverb',
  spawn: false,
  node: 'processor/freeverb',
  group: 'processors',
  object: require('audio-slot/processors/freeverb'),
  render: require('./view')
}