module.exports = {
  name: 'Meddler',
  node: 'chunk/meddler',
  group: 'modifierChunks',
  description: 'Add effects to other chunks.',
  spawn: {
    slots: [{id: 'output', node: 'slot'}],
    inputs: ['input']
  },
  external: {
    shape: [1, 4],
    color: [255, 255, 0],
    minimised: true
  },
  renderExternal: require('./external'),
  render: require('./view'),
  object: require('./object')
}
