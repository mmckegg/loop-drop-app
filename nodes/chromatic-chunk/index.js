module.exports = {
  name: "Chromatic",
  node: 'chunk/scale',
  group: 'chunks',
  external: true,
  renderExternal: require('./external'),
  render: require('./view'),
  object: require('./object')
}
