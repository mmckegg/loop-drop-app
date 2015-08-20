var h = require('lib/h')
var Header = require('lib/widgets/header')
var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')
var ToggleButton = require('lib/params/toggle-button')
var Select = require('lib/params/select')
var QueryParam = require('lib/query-param')

var filterChoices = [
  ['Lowpass', 'lowpass'],
  ['Highpass', 'highpass']
]

var nodeChoices = [
  ['Fast', 'processor/freeverb'],
  ['Convolver', 'processor/reverb']
]

module.exports = function renderReverb (node) {
  return h('ProcessorNode -reverb', [
    Header(node, h('span', 'Reverb')),
    h('ParamList', [
      Select(QueryParam(node, 'node'), {
        defaultValue: 'processor/freeverb',
        options: nodeChoices
      }),
      ToggleButton(node.reverse, {
        title: 'Reverse'
      }),
      Range(node.time, {
        title: 'time',
        defaultValue: 3,
        format: 'ms',
        flex: true
      }),
      Range(node.decay, {
        title: 'decay',
        defaultValue: 2,
        format: 'ratioExp',
        flex: true
      }),
      Select(node.filterType, {
        defaultValue: 'lowpass',
        options: filterChoices 
      }),
      ModRange(node.cutoff, {
        title: 'cutoff',
        defaultValue: 20000,
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