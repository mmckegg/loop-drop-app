var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var QueryParam = require('loop-drop-setup/query-param')
var Header = require('../header.js')
var Range = require('../../params/range.js')
var ModRange = require('../../params/mod-range.js')

module.exports = function(node){
  var data = node()

  return h('ProcessorNode -pitchshift', [

    Header(node, h('span', 'Pitchshift')),

    h('ParamList', [

      Range(node.transpose, {
        title: 'transpose',
        defaultValue: 12,
        format: 'semitoneUp',
        flex: true
      }),

      ModRange(node.wet, {
        title: 'wet',
        defaultValue: 1,
        format: 'dB',
        flex: true
      }),

      ModRange(node.dry, {
        title: 'dry',
        defaultValue: 0,
        format: 'dB',
        flex: true
      }),

    ])

  ])
}