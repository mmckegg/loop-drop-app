var h = require('lib/h')
var Header = require('lib/widgets/header')

var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')

var types = [
  ['White', 'white'],
  ['Pink', 'pink']
]

module.exports = function renderNoise (node) {
  return h('SourceNode -noise', [
    Header(node, h('span', [
      h('strong', 'Noise:'), ' ',
      h('span', node.type)
    ])),
    h('ParamList', [
      Select(node.type, {
        options: types
      }),
      ModRange(node.amp, {
        title: 'amp',
        defaultValue: 1,
        format: 'dB',
        flex: true
      })
    ])
  ])
}
