var h = require('lib/h')
var Header = require('lib/widgets/header')

var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')

var types = [
  ['Snare', 'snare'],
  ['Rim Shot', 'rim']
]

module.exports = function renderDrumSynth (node){
  var data = node()

  return h('SourceNode -drumSynth', [
    Header(node, h('span', [
      h('strong', 'Drum Synth:'), ' ',
      h('span', data.type)
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
      ModRange(node.tune, {
        title: 'tune',
        defaultValue: 0,
        format: 'cents+',
        flex: true
      }),
      ModRange(node.decay, {
        title: 'decay',
        defaultValue: 0.5,
        format: 'ms',
        flex: true
      }),
      node.type() === 'snare' ? [
        ModRange(node.tone, {
          title: 'tone',
          defaultValue: 0.5,
          format: 'ratio',
          flex: true
        }),
        ModRange(node.snappy, {
          title: 'snappy',
          defaultValue: 0.5,
          format: 'ratio',
          flex: true
        })
      ] : null
    ])
  ])
}
