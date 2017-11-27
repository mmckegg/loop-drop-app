var h = require('lib/h')
var Header = require('lib/widgets/header')
var computed = require('mutant/computed')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')
var SampleTrimmer = require('lib/params/sample-trimmer')
var SampleChooser = require('lib/params/sample-chooser')
var SampleRecorder = require('lib/params/sample-recorder')
var QueryParam = require('lib/query-param')

var modeChoices = [
  ['Oneshot', 'oneshot'],
  ['Hold', 'hold'],
  ['Loop', 'loop'],
  ['Release', 'release']
]

var nodeChoices = [
  ['Sample', 'source/sample'],
  ['Granular', 'source/granular']
]

module.exports = function renderSample (node) {
  return h('SourceNode -sample', [
    Header(node, h('span', [
      h('strong', 'Sample:'), ' ',
      h('span', computed(node.buffer, getSampleName))
    ])),
    h('ParamList', [
      Select(QueryParam(node, 'node'), {
        options: nodeChoices
      }),
      SampleRecorder(node),
      SampleChooser(node),
      Select(node.mode, {
        options: modeChoices
      }),
      ModRange(node.startDelay, {
        title: 'start delay',
        format: 'ms1',
        flex: true,
        defaultValue: 0
      }),
      ModRange(node.amp, {
        title: 'amp',
        defaultValue: 1,
        format: 'dB',
        flex: true
      }),
      ModRange(node.transpose, {
        title: 'transpose',
        format: 'semitone',
        flex: true,
        defaultValue: 0
      }),
      ModRange(node.tune, {
        title: 'tune',
        format: 'cents',
        flex: true,
        defaultValue: 0
      })
    ]),
    SampleTrimmer(node)
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
