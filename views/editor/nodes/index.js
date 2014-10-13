var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var nodeEditors = {
  launchpad: require('./launchpad'),
  chunk: require('./chunk'),
  setup: require('./setup.js'),
  external: require('./external')
}

module.exports = function(node, fileObject, collection){
  var data = node()
  if (data){
    var editor = nodeEditors[data.node]
    if (editor){
      return editor(node, fileObject, collection)
    }
  }
  return h('UnknownNode')
}