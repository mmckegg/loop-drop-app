var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var nodeEditors = {
  controller: require('./controller'),
  chunk: require('./chunk'),
  setup: require('./setup.js'),
  external: require('./external'),
  slot: require('./slot'),
  source: require('./source'),
  processor: require('./processor'),
  modulatorChunk: require('./modulator-chunk')
}

module.exports = function(node){
  if (node){
    var data = node()
    var editor = nodeEditors[getRoot(data.node)]
    if (editor){
      return editor(node) || h('UnknownNode')
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