var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var Header = require('../header.js')

var Range = require('../../params/range.js')
var ModRange = require('../../params/mod-range.js')
var Select = require('../../params/select.js')

var QueryParam = require('loop-drop-setup/query-param')

var shapeChoices = [
  ['Sine', 'sine'],
  ['Square', 'square'],
  ['Sawtooth', 'sawtooth'],
  ['Triangle', 'triangle']
]

module.exports = function(node){
  var data = node()

  return h('SourceNode -oscillator', [

    Header(node, h('span', [
      h('strong', 'Oscillator:'), ' ',
      h('span', data.shape || 'sine')
    ])),

    h('ParamList', [

      Select(QueryParam(node, 'shape'), { 
        options: shapeChoices 
      }),

      ModRange(QueryParam(node, 'amp'), {
        title: 'amp',
        defaultValue: 1,
        format: 'dB',
        flex: true
      }),

      ModRange(QueryParam(node, 'detune'), {
        title: 'detune',
        format: 'cents',
        flex: true
      }),

      ModRange(QueryParam(node, 'noteOffset'), {
        title: 'pitch',
        format: 'semitone',
        defaultValue: 0,
        width: 200,
        flex: true
      }),

      ModRange(QueryParam(node, 'octave'), {
        title: 'octave',
        format: 'octave',
        defaultValue: 0,
        width: 200,
        flex: true
      })

    ])

  ])
}