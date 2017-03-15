var bulk = require('bulk-require')
var nodes = bulk(__dirname, [ '*/index.js' ])

var self = module.exports = []
self.lookup = {}
self.objectLookup = {}
self.groupLookup = {}

Object.keys(nodes).forEach(function (key) {
  var item = nodes[key].index
  self.push(item)
  self.lookup[item.node] = item
  self.objectLookup[item.node] = item.object
  if (item.group) {
    self.groupLookup[item.group] = self.groupLookup[item.group] || []
    self.groupLookup[item.group].push(item)
  }
})
