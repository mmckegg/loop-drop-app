var h = require('lib/h')
var Header = require('lib/widgets/header')

var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')

var Select = require('lib/params/select')
var shapeChoices = require('../oscillator/shape-choices')

module.exports = function renderOscillator (node) {
  var data = node()

  return h('ProcessorNode -ringModulator', [

    Header(node, h('span', [
      'Ring Modulator'
    ])),

    h('ParamList', [

      Select(node.carrier.shape, { 
        options: shapeChoices 
      }),

      ModRange(node.carrier.amp, {
        title: 'amp',
        defaultValue: 1,
        format: 'dB',
        flex: true
      }),

      ModRange(node.carrier.frequency, {
        title: 'frequency',
        format: 'arfo',
        flex: true
      })

    ])

  ])
}