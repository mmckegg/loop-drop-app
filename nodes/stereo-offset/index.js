module.exports = {
  name: 'Stereo Offset',
  spawn: false, // spawned by pan
  node: 'processor/stereo-offset',
  group: 'processors',
  object: require('./object'),
  render: require('../pan/view')
}
