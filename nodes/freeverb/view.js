var h = require('lib/h')
var Header = require('lib/widgets/header')
var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')
var QueryParam = require('lib/query-param')
var nodeChoices = require('../reverb/types')

module.exports = function renderFreeverb (node) {
  return h('ProcessorNode -reverb', [
    Header(node, h('span', 'Reverb')),
    h('ParamList', [
      Select(QueryParam(node, 'node'), {
        defaultValue: 'processor/freeverb',
        options: nodeChoices
      }),
      ModRange(node.roomSize, {
        title: 'room size',
        defaultValue: 0.8,
        format: 'ratio1Log',
        flex: true
      }),
      ModRange(node.dampening, {
        title: 'dampening',
        defaultValue: 3000,
        format: 'arfo',
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
        defaultValue: 1,
        format: 'dB',
        flex: true
      })
    ])
  ])
}
