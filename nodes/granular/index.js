module.exports = {
  name: 'Granular',
  node: 'source/granular',
  group: 'sources',
  spawn: false, // spawned via source/sample
  object: require('./object'),
  render: require('./view')
}
