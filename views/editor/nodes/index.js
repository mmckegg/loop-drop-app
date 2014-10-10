var mercury = require('mercury')

var nodeEditors = {
  launchpad: require('./launchpad'),
  setup: require('./setup.js')
}

module.exports = function(node, fileObject, query){
  var data = node()
  if (data){
    var editor = nodeEditors[data.node]
    if (editor){
      return editor(node, fileObject, query)
    }
  }
  return mercury.h('div.UnknownNode')
}