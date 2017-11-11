var randomColor = require('lib/random-color')

module.exports = {
  name: 'MIDI',
  node: 'chunk/midi-out',
  description: 'Output midi notes tuned to current scale.',
  group: 'simpleChunks',
  spawn: function () {
    return {
      color: randomColor()
    }
  },
  object: require('./object'),
  render: require('./view')
}
