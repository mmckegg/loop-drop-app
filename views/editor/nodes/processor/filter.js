var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var Header = require('../header.js')
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

module.exports = function(node){
  var data = node()

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
    })
  ]

  if (~qTypes.indexOf(data.type || 'lowpass')){
    params.push(
      ModRange(node.Q, {
        title: 'Q',
        defaultValue: 1,
        format: 'ratio100',
        flex: true
      })
    )
  }

  if (~gainTypes.indexOf(data.type || 'lowpass')){
    params.push(
      ModRange(node.gain, {
        title: 'gain',
        defaultValue: 1,
        format: 'dBn',
        flex: true
      })
    )
  }

  return h('ProcessorNode -filter', [
    Header(node, h('span', 'Filter')),
    h('ParamList', params)
  ])
}