var h = require('lib/h')
var Header = require('lib/widgets/header')
var ModRange = require('lib/params/mod-range')

module.exports = function renderGain (node){
  return h('ProcessorNode -gain', [
    Header(node, h('span', 'Gain')),
    h('ParamList', [
      ModRange(node.gain, {
        defaultValue: 1,
        format: 'dB',
        flex: true
      })
    ])
  ])
}