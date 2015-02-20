var Orderable = require('./orderable.js')

module.exports = renderCollection

function renderCollection(collection){
  var renderNode = require('./index.js')
  if (collection){
    return collection.map(function(node, i){
      return Orderable(node, renderNode(node))
    })
  }
}