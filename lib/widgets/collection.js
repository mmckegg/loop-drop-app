var Orderable = require('./orderable.js')
var renderNode = require('lib/render-node')
var map = require('@mmckegg/mutant/map')

module.exports = renderCollection

function renderCollection (collection) {
  return map(collection, function (node) {
    return Orderable(node, renderNode(node))
  }, { maxTime: 16 })
}
