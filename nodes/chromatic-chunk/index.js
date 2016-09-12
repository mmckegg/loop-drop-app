var randomColor = require('lib/random-color')

module.exports = {
  name: 'Chromatic',
  node: 'chunk/scale',
  group: 'chunks',
  description: 'Describe a single audio slot that is chromatically scaled over specified shape.',
  spawn: {
    templateSlot: {
      id: { $param: 'id' },
      noteOffset: {
        node: 'modulator/scale',
        value: { $param: 'value' },
        offset: { $param: 'offset' },
        scale: { $param: 'scale' }
      },
      node: 'slot',
      output: 'output'
    },
    outputs: ['output'],
    slots: [{id: 'output', node: 'slot'}],
    selectedSlotId: '$template'
  },
  external: function (context) {
    return {
      color: randomColor()
    }
  },
  renderExternal: require('./external'),
  render: require('./view'),
  object: require('./object')
}
