var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var QueryParam = require('loop-drop-setup/query-param')
var Header = require('../header.js')
var ModRange = require('../../params/mod-range.js')
var Select = require('../../params/select.js')

var modeChoices = [
  ['Modulate', 'modulate'],
  ['Source', 'source']
]

module.exports = function(node){
  var data = node()

  return h('ProcessorNode -dipper', [

    Header(node, h('span', 'Dipper')),

    h('ParamList', [

      Select(QueryParam(node, 'mode'), {
        defaultValue: 'modulate',
        options: modeChoices 
      }),

      ModRange(QueryParam(node, 'ratio'), {
        title: 'ratio',
        defaultValue: 1,
        format: 'ratio',
        flex: true
      })

    ])

  ])
}