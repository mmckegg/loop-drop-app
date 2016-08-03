var h = require('lib/h')
var Header = require('lib/widgets/header')
var ModRange = require('lib/params/mod-range')

module.exports = function renderCompressor (node){
  return h('ProcessorNode -compressor', [
    Header(node, h('span', 'Compressor')),
    h('ParamList', [
      ModRange(node.threshold, {
        title: 'threshold',
        format: 'dBn',
        flex: true
      }),
      ModRange(node.knee, {
        title: 'knee',
        format: 'dBn',
        flex: true
      }),
      ModRange(node.ratio, {
        title: 'ratio',
        format: 'compressionRatio',
        flex: true
      }),
      ModRange(node.attack, {
        title: 'attack',
        format: 'ms',
        flex: true
      }),
      ModRange(node.release, {
        title: 'release',
        format: 'ms',
        flex: true
      })
    ])
  ])
}
