var h = require('lib/h')
var computed = require('mutant/computed')
var when = require('mutant/when')
var Header = require('lib/widgets/header')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')

var typeChoices = [
  ['Lowpass', 'lowpass'],
  ['Highpass', 'highpass'],
  ['Bandpass', 'bandpass'],
  ['Lowshelf', 'lowshelf'],
  ['Highshelf', 'highshelf'],
  ['Peaking', 'peaking'],
  ['Notch', 'notch'],
  ['Allpass', 'allpass']
]

var gainTypes = ['lowshelf', 'highshelf', 'peaking']
var qTypes = ['lowpass', 'highpass', 'bandpass', 'peaking', 'notch', 'allpass']

module.exports = function renderFilter (node) {
  var hasGain = computed(node.type, t => ~gainTypes.indexOf(t))
  var hasQ = computed(node.type, t => ~qTypes.indexOf(t))

  var params = [
    Select(node.type, {
      defaultValue: 'lowpass',
      options: typeChoices
    }),

    ModRange(node.frequency, {
      title: 'freq',
      defaultValue: 300,
      format: 'arfo',
      flex: true
    }),

    when(hasQ, ModRange(node.Q, {
      title: 'Q',
      defaultValue: 1,
      format: 'ratio100',
      flex: true
    })),

    when(hasGain, ModRange(node.gain, {
      title: 'gain',
      defaultValue: 1,
      format: 'dBn',
      flex: true
    }))
  ]

  return h('ProcessorNode -filter', [
    Header(node, h('span', 'Filter')),
    h('ParamList', params)
  ])
}
