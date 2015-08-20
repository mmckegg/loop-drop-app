var h = require('lib/h')
var Header = require('lib/widgets/header')
var Range = require('lib/params/range')

module.exports = function renderBitcrusher (node) {
  return h('ProcessorNode -bitcrusher', [
    Header(node, h('span', 'Bitcrusher')),
    h('ParamList', [
      Range(node.bitDepth, {
        title: 'bit depth',
        defaultValue: 8,
        format: 'bit',
        flex: true
      }),
      Range(node.frequency, {
        title: 'freq',
        defaultValue: 1,
        format: 'sampleRatio',
        flex: true
      })
    ])
  ])
}