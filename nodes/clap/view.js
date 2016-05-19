var h = require('lib/h')
var Header = require('lib/widgets/header')

var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')

module.exports = function renderDrumSynth (node){
  var data = node()

  return h('SourceNode -drumSynth', [
    Header(node, h('span', [
      h('strong', 'Drum Synth:'), ' Clap'
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
        defaultValue: 0.5,
        format: 'ms',
        flex: true
      }),
      ModRange(node.tone, {
        title: 'tone',
        defaultValue: 0.5,
        format: 'ratio',
        flex: true
      }),
      ModRange(node.density, {
        title: 'density',
        defaultValue: 0.2,
        format: 'ratio',
        flex: true
      })
    ])
  ])
}
