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

    ]),

    h('h1', 'Timing'),

    h('ParamList', [

      ToggleButton(node.sync, {
        title: 'BPM Sync'
      }),

      node.sync() ? [

        Range(node.sync.tempo, {
          title: 'bpm',
          format: 'bpm',
          flex: true
        }),

        Range(node.sync.trim, {
          title: 'start',
          format: 'ratio1',
          width: 100,
          flex: true
        }),

        Range(node.sync.beatOffset, {
          title: 'beat offset',
          format: 'beatOffset',
          width: 100,
          flex: true
        }),

        Range(node.sync.beats, {
          title: 'beats',
          format: 'beats2',
          flex: true
        })

      ] : [
        Range(node.duration, {
          title: 'duration',
          defaultValue: 1,
          format: 'ms',
          flex: true
        })
      ]
    ]),

    h('h1', 'Grains'),

    h('ParamList', [

      Range(node.rate, {
        title: 'rate',
        defaultValue: 16,
        format: 'ratio32',
        flex: true
      }),

      Range(node.attack, {
        title: 'attack',
        format: 'ratio',
        width: 100,
        defaultValue: 0.1,
        flex: true
      }),

      Range(node.hold, {
        title: 'hold',
        format: 'ratio',
        defaultValue: 1,
        width: 100,
        flex: true
      }),

      Range(node.release, {
        title: 'release',
        format: 'ratio',
        defaultValue: 0.1,
        width: 100,
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