var h = require('lib/h')
var Header = require('lib/widgets/header')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')

var modeChoices = [
  ['Modulate', 'modulate'],
  ['Source', 'source']
]

module.exports = function renderDipper (node) {
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
