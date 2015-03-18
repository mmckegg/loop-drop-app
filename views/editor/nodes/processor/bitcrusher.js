var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var QueryParam = require('loop-drop-setup/query-param')
var Header = require('../header.js')
var Range = require('../../params/range.js')

module.exports = function(node){
  var data = node()

  return h('ProcessorNode -bitcrusher', [

    Header(node, h('span', 'Bitcrusher')),

    h('ParamList', [

      Range(node.bitDepth, {
        title: 'bit depth',
        defaultValue: 8,
        format: 'bit',
        flex: true
      }),

      Range(node.frequency, {
        title: 'freq',
        defaultValue: 1,
        format: 'sampleRatio',
        flex: true
      })

    ])

  ])
}