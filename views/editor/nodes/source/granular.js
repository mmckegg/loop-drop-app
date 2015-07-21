var h = require('micro-css/h')(require('virtual-dom/h'))
var Header = require('../header.js')

var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')
var ToggleButton = require('lib/params/toggle-button')
var SampleTrimmer = require('lib/params/sample-trimmer')
var SampleChooser = require('lib/params/sample-chooser')

var modeChoices = [
  ['Loop', 'loop'],
  ['Oneshot', 'oneshot']
]

module.exports = function(node){
  var data = node()

  var isSyncing = node.sync()

  return h('SourceNode -granular', [

    Header(node, h('span', [
      h('strong', 'Granular:'), ' ',
      h('span', getSampleName(data.buffer) || 'none')
    ])),

    h('ParamList', [

      SampleChooser(node),

      Select(node.mode, { 
        options: modeChoices,
        defaultValue: 'loop'
      }),

      ToggleButton(node.sync, {
        title: 'BPM Sync'
      }),

      Range(node.duration, {
        title: 'duration',
        defaultValue: 1,
        format: isSyncing ? 'beats' : 'ms',
        flex: true
      }),

      Range(node.rate, {
        title: 'rate',
        defaultValue: 16,
        format: 'ratio32',
        flex: true
      }),

      ModRange(node.amp, {
        title: 'amp',
        format: 'dB',
        defaultValue: 1,
        flex: true
      }),

      ModRange(node.transpose, {
        title: 'transpose',
        format: 'semitone',
        flex: true
      }),

      Range(node.attack, {
        title: 'attack',
        format: 'ratio',
        defaultValue: 0.1,
        flex: true
      }),

      Range(node.hold, {
        title: 'hold',
        format: 'ratio',
        defaultValue: 1,
        flex: true
      }),

      Range(node.release, {
        title: 'release',
        format: 'ratio',
        defaultValue: 0.1,
        flex: true
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