var h = require('lib/h')
var Header = require('lib/widgets/header')
var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')
var SampleTrimmer = require('lib/params/sample-trimmer')
var SampleChooser = require('lib/params/sample-chooser')

var modeChoices = [
  ['Oneshot', 'oneshot'],
  ['Hold', 'hold'],
  ['Loop', 'loop'],
  ['Release', 'release']
]

module.exports = function renderSample (node) {
  var data = node()

  return h('SourceNode -sample', [

    Header(node, h('span', [
      h('strong', 'Sample:'), ' ',
      h('span', getSampleName(data.buffer) || 'none')
    ])),

    h('ParamList', [

      SampleChooser(node),

      Select(node.mode, { 
        options: modeChoices 
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

function getSampleName(data){
  var src = data && data.src
  if (typeof src === 'string'){
    return src.replace(/^\.\//, '')
  }
}