var randomColor = require('lib/random-color')

module.exports = {
  node: 'chunk/slicer',
  name: 'Slicer',
  description: 'Slice an audio file into pieces and distribute across controller.',
  group: 'simpleChunks',
  object: require('./object'),
  spawn: function () {
    return {
      color: randomColor(),
      chokeAll: true
    }
  },
  render: require('./view')
}
