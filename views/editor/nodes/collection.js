module.exports = renderCollection
function renderCollection(collection, file){
  var renderNode = require('./index.js')
  if (collection){
    return collection.map(function(node, i){
      return renderNode(node, file, collection)
    })
  }
}