var h = require('lib/h')
var Header = require('lib/widgets/header')
var ModRange = require('lib/params/mod-range')

module.exports = function renderDrumSynth (node) {
  return h('SourceNode -drumSynth', [
    Header(node, h('span', [
      h('strong', 'Drum Synth:'), ' Cymbal'
    ])),
    h('ParamList', [
      ModRange(node.amp, {
        title: 'amp',
        defaultValue: 1,
        format: 'dB',
        flex: true
      }),
      ModRange(node.decay, {
        title: 'decay',
        defaultValue: 0.3,
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
