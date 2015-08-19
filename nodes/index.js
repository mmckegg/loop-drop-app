var fs = require('fs')
var join = require('path').join

var self = module.exports = []
self.lookup = {}
self.objectLookup = {}
self.groupLookup = {}

fs.readdirSync(__dirname).forEach(function (entry) {
  var path = join(__dirname, entry, 'index.js')
  if (fs.existsSync(path)) {
    var item = require(path)
    self.push(item)
    self.lookup[item.node || entry] = item
    self.objectLookup[item.node || entry] = item.object
    if (item.group) {
      self.groupLookup[item.group] = self.groupLookup[item.group] || []
      self.groupLookup[item.group].push(item)
    }
  } 
})