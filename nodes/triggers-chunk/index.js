var randomColor = require('lib/random-color')

module.exports = {
  name: 'Triggers',
  node: 'chunk',
  group: 'chunks',
  description: 'A collection of triggerable audio slots.',
  spawn: {
    slots: [{id: 'output', node: 'slot'}],
    outputs: ['output']
  },
  external: function (context) {
    return {
      color: randomColor([255, 255, 255]),
      shape: [2, 4],
      minimised: true
    }
  },
  renderExternal: require('./external'),
  render: require('./view'),
  object: require('./object')
}
