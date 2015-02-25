var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var Header = require('../header.js')

var editors = {
  'processor/overdrive': require('./overdrive.js'),
  'processor/filter': require('./filter.js'),
  'processor/reverb': require('./reverb.js'),
  'processor/bitcrusher': require('./bitcrusher.js'),
  'processor/delay': require('./delay.js'),
  'processor/dipper': require('./dipper.js'),
  'processor/gain': require('./gain.js'),
  'processor/pitchshift': require('./pitchshift.js')
}

module.exports = function(node){
  var editor = editors[node.nodeName]
  return (
    typeof editor == 'function' && editor(node) || 
    h('ProcessorNode -unknown', 
      Header(node, 
        h('span', [
          h('strong', 'Processor'), 
          ' (unknown)'
        ])
      )
    )
  )
}