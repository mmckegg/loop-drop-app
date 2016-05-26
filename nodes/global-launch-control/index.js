module.exports = {
  name: 'Launch Control',
  portMatch: /^Launch Control(?! XL)/,
  node: 'global/launch-control',
  group: 'global-controllers',
  object: require('./object')
}
