var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var Header = require('../header.js')

var editors = {
  'source/sample': require('./sample.js'),
  'source/oscillator': require('./oscillator.js'),
  'source/granular': require('./granular.js'),
  'source/noise': require('./noise.js')
}

module.exports = function(node){
  var editor = editors[node.nodeName]
  return (
    typeof editor == 'function' && editor(node) || 
    h('SourceNode -unknown', 
      Header(node, 
        h('span', [
          h('strong', 'Processor'), 
          ' (unknown)'
        ])
      )
    )
  )
}