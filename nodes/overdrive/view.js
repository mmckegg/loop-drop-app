var h = require('lib/h')
var Header = require('lib/widgets/header')
var ModRange = require('lib/params/mod-range')

module.exports = function renderOverdrive (node) {
  return h('ProcessorNode -overdrive', [
    Header(node, h('span', 'Overdrive')),
    h('ParamList', [
      ModRange(node.preBand, {
        title: 'pre band',
        defaultValue: 0.5,
        format: 'ratio',
        flex: true
      }),
      ModRange(node.color, {
        title: 'color',
        defaultValue: 800,
        format: 'arfo',
        flex: true
      }),
      ModRange(node.gain, {
        title: 'gain',
        defaultValue: 1,
        format: 'dB',
        flex: true
      }),
      ModRange(node.postCut, {
        title: 'post cut',
        defaultValue: 3000,
        format: 'arfo',
        flex: true
      })
    ])
  ])
}
