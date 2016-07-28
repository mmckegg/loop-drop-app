var h = require('lib/h')
var Header = require('lib/widgets/header')

var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')

var shapeChoices = require('./shape-choices')

module.exports = function renderOscillator (node) {
  return h('SourceNode -oscillator', [
    Header(node, h('span', [
      h('strong', 'Oscillator:'), ' ',
      h('span', node.shape)
    ])),
    h('ParamList', [
      Select(node.shape, {
        options: shapeChoices
      }),
      ModRange(node.amp, {
        title: 'amp',
        defaultValue: 1,
        format: 'dB',
        flex: true
      }),
      ModRange(node.detune, {
        title: 'detune',
        format: 'cents',
        flex: true,
        defaultValue: 0
      }),
      ModRange(node.noteOffset, {
        title: 'pitch',
        format: 'semitone',
        defaultValue: 0,
        flex: true
      }),
      ModRange(node.octave, {
        title: 'octave',
        format: 'octave',
        defaultValue: 0,
        flex: true
      })
    ])
  ])
}
