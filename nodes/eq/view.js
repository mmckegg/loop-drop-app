var h = require('lib/h')
var Header = require('lib/widgets/header')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')

module.exports = function renderFilter(node) {
  return h('ProcessorNode -filter', [
    Header(node, h('span', 'EQ')),
    h('section', [
      h('ParamList', [
        ModRange(node.low, {
          title: 'low',
          defaultValue: 0,
          format: 'dBn',
          flex: 'small'
        }),
        ModRange(node.mid, {
          title: 'mid',
          defaultValue: 0,
          format: 'dBn',
          flex: 'small'
        }),
        ModRange(node.high, {
          title: 'high',
          defaultValue: 0,
          format: 'dBn',
          flex: 'small'
        }),
        ModRange(node.highcut, {
          title: 'highcut',
          format: 'arfo',
          flex: 'small',
          defaultValue: 20000
        }),
        ModRange(node.lowcut, {
          title: 'lowcut',
          format: 'arfo',
          flex: 'small',
          defaultValue: 0
        })
      ])
    ])
  ])
}
