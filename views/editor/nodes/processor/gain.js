var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var Header = require('../header.js')
var ModRange = require('lib/params/mod-range')

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