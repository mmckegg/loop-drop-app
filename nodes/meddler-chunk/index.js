module.exports = {
  name: 'Meddler',
  node: 'chunk/meddler',
  group: 'modifierChunks',
  description: 'Add effects to other chunks.',
  spawn: {
    shape: [1, 4],
    slots: [{id: 'output', node: 'slot'}],
    color: [255, 255, 0],
    inputs: ['input'],
    minimised: true
  },
  external: true,
  renderExternal: require('./external'),
  render: require('./view'),
  object: require('./object')
}
