var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var QueryParam = require('loop-drop-setup/query-param')
var Header = require('../header.js')
var ModRange = require('../../params/mod-range.js')
var ToggleButton = require('../../params/toggle-button.js')
var Select = require('../../params/select.js')

var filterChoices = [
  ['Lowpass', 'lowpass'],
  ['Highpass', 'highpass']
]

module.exports = function(node){
  var data = node()

  var sync = QueryParam(node, 'sync')
  var isSyncing = sync.read()

  return h('ProcessorNode -delay', [

    Header(node, h('span', 'Delay')),

    h('ParamList', [

      ToggleButton(sync, {
        title: 'BPM Sync'
      }),

      ModRange(QueryParam(node, 'time'), {
        title: 'time',
        defaultValue: 0.25,
        format: isSyncing ? 'beat' : 'ms',
        flex: true
      }),

      ModRange(QueryParam(node, 'feedback'), {
        title: 'feedback',
        defaultValue: 0.6,
        format: 'dB',
        flex: true
      }),

      Select(QueryParam(node, 'filterType'), {
        defaultValue: 'lowpass',
        options: filterChoices 
      }),

      ModRange(QueryParam(node, 'cutoff'), {
        title: 'cutoff',
        defaultValue: 20000,
        format: 'arfo',
        flex: true
      }),

      ModRange(QueryParam(node, 'wet'), {
        title: 'wet',
        defaultValue: 1,
        format: 'dB',
        flex: true
      }),

      ModRange(QueryParam(node, 'dry'), {
        title: 'dry',
        defaultValue: 1,
        format: 'dB',
        flex: true
      })

    ])

  ])
}