module.exports = {
  name: 'Oscillator (pulse)',
  node: 'source/oscillator-pulse',
  group: 'sources',
  spawn: false, // spawned by source/oscillator by setting type
  object: require('./object'),
  render: require('./view')
}
