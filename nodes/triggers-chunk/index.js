module.exports = {
  name: "Triggers",
  node: 'chunk',
  group: 'chunks',
  external: true,
  renderExternal: require('./external'),
  render: require('./view'),
  object: require('./object')
}