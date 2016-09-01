module.exports = {
  name: 'Delay',
  spawn: false, // spawned from delay node
  node: 'processor/ping-pong-delay',
  group: 'processors',
  object: require('./object'),
  render: require('../delay/view')
}
