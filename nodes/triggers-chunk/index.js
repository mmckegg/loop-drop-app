var randomColor = require('lib/random-color')

module.exports = {
  name: "Triggers",
  node: 'chunk',
  group: 'chunks',
  description: 'A collection of triggerable audio slots.',
  spawn: {
    minimised: true
  },
  external: function (context) {
    return {
      color: randomColor([255,255,255]),
      slots: [{id: 'output', node: 'slot'}],
      shape: [2,4],
      outputs: ['output']
    }
  },
  renderExternal: require('./external'),
  render: require('./view'),
  object: require('./object')
}
