var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var externalEditors = {
  chunk: require('./chunk.js'),
  rangeChunk: require('./chunk.js')
}

module.exports = function(node, setup){
  var data = node()
  var innerData = node.resolved() || {}
  if (innerData.node && innerData.node !== 'external'){
    var editor = externalEditors[innerData.node]
    if (editor){
      return editor(node, setup)
    }
  }
  return h('div ExternalNode', [
    h('header', data.id + ' (external)')
  ])
}