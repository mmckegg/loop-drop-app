module.exports = {
  name: 'Sample',
  node: 'source/sample',
  group: 'sources',
  object: require('audio-slot/sources/sample'),
  spawn: {
    amp: {
      node: 'modulator/adsr',
      value: 1,
      release: 0.01
    },
    mode: 'oneshot'
  },
  render: require('./view')
}
