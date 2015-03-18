var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var QueryParam = require('loop-drop-setup/query-param')
var Header = require('../header.js')
var ModRange = require('../../params/mod-range.js')

module.exports = function(node){
  var data = node()

  return h('ProcessorNode -gain', [

    Header(node, h('span', 'Gain')),

    h('ParamList', [

      ModRange(node.gain, {
        defaultValue: 1,
        format: 'dB',
        flex: true
      })

    ])

  ])
}