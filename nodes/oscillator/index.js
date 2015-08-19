module.exports = {
  name: 'Oscillator',
  node: 'source/oscillator',
  group: 'sources',
  spawn: {
    amp: { 
      node: 'modulator/adsr', 
      value: 0.6, 
      release: 0.01 
    }
  },
  object: require('audio-slot/sources/oscillator'),
  render: require('./view')
}
