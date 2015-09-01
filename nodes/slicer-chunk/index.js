var randomColor = require('lib/random-color')

module.exports = {
  node: 'chunk/slicer',
  name: 'Slicer',
  description: 'Slice an audio file into pieces and distribute across controller.',
  group: 'chunks',
  object: require('./object'),
  spawn: function () {
    color: randomColor()
  },
  render: require('./view')
}
