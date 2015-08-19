module.exports = {
  name: 'Reverb',
  node: 'processor/reverb',
  group: 'processors',
  object: require('audio-slot/processors/reverb'),
  render: require('./view')
}
