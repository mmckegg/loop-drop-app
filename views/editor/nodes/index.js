var mercury = require('mercury')

var nodeEditors = {
  launchpad: require('./launchpad'),
  setup: require('./setup.js')
}

module.exports = function(node, file, query){
  var data = node()
  console.log(data)
  if (data){
    var editor = nodeEditors[data.node]
    if (editor){
      return editor(node, file, query)
    }
  }
  return mercury.h('div.UnknownNode')
}