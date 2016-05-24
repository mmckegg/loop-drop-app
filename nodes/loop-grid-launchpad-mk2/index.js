module.exports = {
  name: 'Launchpad',
  group: 'loop-grids',
  portMatch: /^Launchpad (MK2|Pro)/,
  node: 'controller/launchpad-mk2',
  render: require('../loop-grid/view'),
  object: require('./object')
}
