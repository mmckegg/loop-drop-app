var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var nodeEditors = {
  launchpad: require('./launchpad'),
  setup: require('./setup.js'),
  external: require('./external')
}

module.exports = function(node, fileObject, query){
  var data = node()
  if (data){
    var editor = nodeEditors[data.node]
    if (editor){
      return editor(node, fileObject, query)
    }
  }
  return h('UnknownNode')
}