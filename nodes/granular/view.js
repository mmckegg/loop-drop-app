var h = require('lib/h')
var computed = require('@mmckegg/mutant/computed')
var when = require('@mmckegg/mutant/when')
var Header = require('lib/widgets/header')
var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')
var ToggleButton = require('lib/params/toggle-button')
var SampleTrimmer = require('lib/params/sample-trimmer')
var SampleChooser = require('lib/params/sample-chooser')
var SampleRecorder = require('lib/params/sample-recorder')

var modeChoices = [
  ['Loop', 'loop'],
  ['Oneshot', 'oneshot']
]

module.exports = function renderGranular (node) {
  return h('SourceNode -granular', [
    Header(node, h('span', [
      h('strong', 'Granular:'), ' ',
      h('span', computed(node.buffer, getSampleName))
    ])),
    h('ParamList', [
      SampleRecorder(node),
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
        flex: true,
        defaultValue: 0
      })
    ]),
    h('h1', 'Timing'),
    h('ParamList', [
      ToggleButton(node.sync, {
        title: 'BPM Sync'
      }),
      when(node.sync, [
        Range(node.sync.tempo, {
          title: 'bpm',
          format: 'bpm',
          flex: true,
          defaultValue: 100
        }),
        Range(node.sync.trim, {
          title: 'start',
          format: 'ratio1',
          width: 100,
          flex: true,
          defaultValue: 0
        }),
        Range(node.sync.beatOffset, {
          title: 'beat offset',
          format: 'beatOffset',
          width: 100,
          flex: true,
          defaultValue: 0
        }),
        Range(node.sync.beats, {
          title: 'beats',
          format: 'beats2',
          flex: true,
          defaultValue: 0
        })
      ], [
        Range(node.duration, {
          title: 'duration',
          defaultValue: 1,
          format: 'ms',
          flex: true
        })
      ])
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

function getSampleName (data) {
  var src = data && data.src
  if (typeof src === 'string') {
    return src.replace(/^\.\//, '')
  } else {
    return 'none'
  }
}
