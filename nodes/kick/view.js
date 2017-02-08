var h = require('lib/h')
var Header = require('lib/widgets/header')
var computed = require('mutant/computed')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')

var types = [
  ['808', '808'],
  ['909', '909']
]

module.exports = function renderDrumSynth (node) {
  return h('SourceNode -drumSynth', [
    Header(node, h('span', [
      h('strong', 'Drum Synth:'), ' Kick ',
      h('span', computed(node, d => d.node))
    ])),
    h('ParamList', [
      Select(node.type, {
        options: types
      }),
      ModRange(node.amp, {
        title: 'amp',
        defaultValue: 1,
        format: 'dB',
        flex: true
      }),
      ModRange(node.tone, {
        title: 'tone',
        defaultValue: 0.5,
        format: 'ratio',
        flex: true
      }),
      ModRange(node.decay, {
        title: 'decay',
        defaultValue: 0.5,
        format: 'ms',
        flex: true
      }),
      ModRange(node.tune, {
        title: 'tune',
        defaultValue: 0,
        format: 'cents+',
        flex: true
      })
    ])
  ])
}
