var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var nodeEditors = {
  controller: require('./controller'),
  chunk: require('./chunk'),
  setup: require('./setup.js'),
  external: require('./external')
}

module.exports = function(node, fileObject, collection){
  if (node){
    var data = node()
    if (data){
      var editor = nodeEditors[getRoot(data.node)]
      if (editor){
        return editor(node, fileObject, collection)
      }
    }
  }
  return h('UnknownNode')
}

function getRoot(nodeName){
  if (nodeName){
    var index = nodeName.indexOf('/')
    if (~index){
      return nodeName.slice(0, index)
    }
  }
  return nodeName
}