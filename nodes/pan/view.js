var h = require('lib/h')
var Header = require('lib/widgets/header')
var ModRange = require('lib/params/mod-range')
var ToggleButton = require('lib/params/toggle-button')
var QueryParam = require('lib/query-param')

module.exports = function renderPanNode (node) {
  return h('ProcessorNode -pan', [
    Header(node, h('span', 'Pan')),
    h('ParamList', [
      ToggleButton(QueryParam(node, 'node'), {
        title: 'Spatial',
        onValue: 'processor/spatial-pan',
        offValue: 'processor/pan'
      }),
      ModRange(node.offset, {
        defaultValue: 0,
        format: 'pan',
        flex: true
      })
    ])
  ])
}
