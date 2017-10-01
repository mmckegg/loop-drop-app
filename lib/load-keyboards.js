var bulk = require('bulk-require')
var path = require('path')
var os = require('os')

module.exports = function (nodes) {
  var folder = path.resolve(os.homedir(), '.loopdrop')
  var keyboards = bulk(folder,  ['**/*.json' ])
  Object.keys(keyboards).forEach(function (keyboard) {
    var about = keyboards[keyboard]
    var item = {
      name: keyboard,
      group: 'loop-grids',
      node: 'controller/keyboard-' + keyboard,
      render: require('lib/generic-keyboard/view'),
      object: require('lib/generic-keyboard/object')(about)
    }
    if (about.portMatch) item.portMatch = new RegExp(about.portMatch)
    nodes.push(item)
    nodes.lookup[item.node] = item
    nodes.objectLookup[item.node] = item.object
    if (item.group) {
      nodes.groupLookup[item.group] = nodes.groupLookup[item.group] || []
      nodes.groupLookup[item.group].push(item)
    }
  })
}
