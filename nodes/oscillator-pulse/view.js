var h = require('lib/h')
var Header = require('lib/widgets/header')

var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')
var Value = require('mutant/value')
var extend = require('xtend')

var shapeChoices = require('../oscillator/shape-choices')

module.exports = function renderOscillator (node) {
  var shape = Value('pulse')
  shape(value => {
    if (value !== 'pulse') {
      node.set(extend(node(), {
        node: 'source/oscillator',
        shape: value
      }))
    }
  })

  return h('SourceNode -oscillatorPulse', [
    Header(node, h('span', [
      h('strong', 'Oscillator:'), ' ',
      h('span', 'Pulse')
    ])),
    h('ParamList', [
      Select(shape, {
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
      ModRange(node.pulseWidth, {
        title: 'pulse width',
        format: 'offset1',
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
