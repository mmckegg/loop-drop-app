module.exports = {
  name: 'Launch Control XL',
  group: 'mixers',
  portMatch: /^Launch Control XL/,
  node: 'controller/launch-control-xl',
  render: require('./view'),
  object: require('./object')
}
