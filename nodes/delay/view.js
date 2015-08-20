var h = require('lib/h')
var Header = require('lib/widgets/header')
var ModRange = require('lib/params/mod-range')
var ToggleButton = require('lib/params/toggle-button')
var Select = require('lib/params/select')

var filterChoices = [
  ['Lowpass', 'lowpass'],
  ['Highpass', 'highpass']
]

module.exports = function renderDelay (node) {
  var data = node()

  var isSyncing = node.sync()

  return h('ProcessorNode -delay', [

    Header(node, h('span', 'Delay')),

    h('ParamList', [

      ToggleButton(node.sync, {
        title: 'BPM Sync'
      }),

      ModRange(node.time, {
        title: 'time',
        defaultValue: 0.25,
        format: isSyncing ? 'beat' : 'ms',
        flex: true
      }),

      ModRange(node.feedback, {
        title: 'feedback',
        defaultValue: 0.6,
        format: 'dB',
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