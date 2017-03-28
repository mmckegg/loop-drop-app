module.exports = {
  name: 'Spatial Pan',
  spawn: false, // spawned by pan
  node: 'processor/spatial-pan',
  group: 'processors',
  object: require('./object'),
  render: require('../pan/view')
}
