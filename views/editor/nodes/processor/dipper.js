var h = require('micro-css/h')(require('virtual-dom/h'))

var Header = require('../header.js')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')

var modeChoices = [
  ['Modulate', 'modulate'],
  ['Source', 'source']
]

module.exports = function(node){
  var data = node()

  return h('ProcessorNode -dipper', [

    Header(node, h('span', 'Dipper')),

    h('ParamList', [

      Select(node.mode, {
        defaultValue: 'modulate',
        options: modeChoices 
      }),

      ModRange(node.ratio, {
        title: 'ratio',
        defaultValue: 1,
        format: 'ratio',
        flex: true
      })

    ])

  ])
}