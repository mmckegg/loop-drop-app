module.exports = {
  name: 'Oscillator (pulse)',
  node: 'source/oscillator-pulse',
  group: 'sources',
  spawn: {
    amp: {
      node: 'modulator/adsr',
      value: 0.6,
      release: 0.01
    }
  },
  object: require('./object'),
  render: require('./view')
}
