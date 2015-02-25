var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var QueryParam = require('loop-drop-setup/query-param')
var Header = require('../header.js')
var Range = require('../../params/range.js')
var ModRange = require('../../params/mod-range.js')
var ToggleButton = require('../../params/toggle-button.js')
var Select = require('../../params/select.js')

var filterChoices = [
  ['Lowpass', 'lowpass'],
  ['Highpass', 'highpass']
]

module.exports = function(node){
  var data = node()

  return h('ProcessorNode -reverb', [

    Header(node, h('span', 'Reverb')),

    h('ParamList', [

      ToggleButton(QueryParam(node, 'reverse'), {
        title: 'Reverse'
      }),

      Range(QueryParam(node, 'time'), {
        title: 'time',
        defaultValue: 3,
        format: 'ms',
        flex: true
      }),

      Range(QueryParam(node, 'decay'), {
        title: 'decay',
        defaultValue: 2,
        format: 'ratioExp',
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
      }),

    ])

  ])
}