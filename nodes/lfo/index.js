module.exports = {
  name: 'LFO',
  group: 'modulators',
  node: 'modulator/lfo',
  object: require('./object'),
  render: require('./view'),
  spawn: {
    amp: 0.5,
    mode: 'add',
    value: 0.5
  },
}
