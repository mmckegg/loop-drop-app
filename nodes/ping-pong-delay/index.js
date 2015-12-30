module.exports = {
  name: 'Delay',
  spawn: false, // spawned from delay node
  node: 'processor/ping-pong-delay',
  group: 'processors',
  object: require('audio-slot/processors/ping-pong-delay'),
  render: require('../delay/view')
}
