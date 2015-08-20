var Orderable = require('./orderable.js')
var renderNode = require('lib/render-node')

module.exports = renderCollection

function renderCollection(collection){
  if (collection){
    return collection.map(function(node, i){
      return Orderable(node, renderNode(node))
    })
  }
}