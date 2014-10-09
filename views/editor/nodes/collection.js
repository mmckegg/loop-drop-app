module.exports = renderCollection
function renderCollection(collection, file, query){
  var renderNode = require('./index.js')
  if (collection){
    return collection.map(function(node, i){
      return renderNode(node, file, query + '[' + i + ']')
    })
  }
}