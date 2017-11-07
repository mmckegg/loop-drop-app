var h = require('lib/h')
var Header = require('lib/widgets/header')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')
var QueryParam = require('lib/query-param')
var nodeChoices = require('../reverb/types')
var SampleChooser = require('lib/params/sample-chooser')
var AcceptSampleHook = require('lib/accept-sample-hook')
var computed = require('mutant/computed')

module.exports = function renderReverb (node) {
  return h('ProcessorNode -reverb', {
    hooks: [ AcceptSampleHook(node) ]
  }, [
    Header(node, h('span', [
      h('strong', 'Reverb:'), ' ',
      h('span', computed(node.buffer, getSampleName))
    ])),
    h('ParamList', [
      Select(QueryParam(node, 'node'), {
        defaultValue: 'processor/convolution-reverb',
        options: nodeChoices
      }),
      SampleChooser(node),
      ModRange(node.low, {
        title: 'low',
        defaultValue: 0,
        format: 'dBn',
        flex: 'small'
      }),
      ModRange(node.mid, {
        title: 'mid',
        defaultValue: 0,
        format: 'dBn',
        flex: 'small'
      }),
      ModRange(node.high, {
        title: 'high',
        defaultValue: 0,
        format: 'dBn',
        flex: 'small'
      }),
      ModRange(node.highcut, {
        title: 'highcut',
        format: 'arfo',
        flex: 'small',
        defaultValue: 20000
      }),
      ModRange(node.lowcut, {
        title: 'lowcut',
        format: 'arfo',
        flex: 'small',
        defaultValue: 0
      }),
      ModRange(node.wet, {
        title: 'wet',
        defaultValue: 1,
        format: 'dB',
        flex: true
      }),
      ModRange(node.dry, {
        title: 'dry',
        defaultValue: 1,
        format: 'dB',
        flex: true
      })
    ])
  ])
}

function getSampleName (data) {
  var src = data && data.src
  if (typeof src === 'string') {
    return src.replace(/^\.\//, '')
  } else {
    return 'none'
  }
}
