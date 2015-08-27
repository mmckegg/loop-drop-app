module.exports = {
  name: "Meddler",
  node: 'chunk/meddler',
  group: 'chunks',
  external: true,
  renderExternal: require('./external'),
  render: require('./view'),
  object: require('./object')
}