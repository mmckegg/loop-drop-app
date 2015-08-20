var h = require('lib/h')
var Header = require('lib/widgets/header')
var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')

module.exports = function renderPitchshift (node) {
  return h('ProcessorNode -pitchshift', [
    Header(node, h('span', 'Pitchshift')),
    h('ParamList', [
      Range(node.transpose, {
        title: 'transpose',
        defaultValue: 12,
        format: 'semitoneUp',
        flex: true
      }),
      ModRange(node.wet, {
        title: 'wet',
        defaultValue: 1,
        format: 'dB',
        flex: true
      }),
      ModRange(node.dry, {
        title: 'dry',
        defaultValue: 0,
        format: 'dB',
        flex: true
      })
    ])
  ])
}