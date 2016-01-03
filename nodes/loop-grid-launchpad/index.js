module.exports = {
  name: 'Launchpad',
  group: 'loop-grids',
  portMatch: /^Launchpad/,
  node: 'controller/launchpad',
  render: require('../loop-grid/view'),
  object: require('./object')
}
