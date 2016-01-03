module.exports = {
  name: 'Ableton Push',
  group: 'loop-grids',
  portMatch: /^Ableton Push/,
  node: 'controller/push',
  render: require('../loop-grid/view'),
  object: require('./object')
}
