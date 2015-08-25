module.exports = {
  name: 'Launch Control',
  portMatch: /^Launch Control/,
  node: 'global/launch-control',
  group: 'global-controllers',
  object: require('./object')
}