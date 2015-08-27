var h = require('lib/h')
var renderRouting = require('lib/widgets/routing')
var FlagParam = require('lib/flag-param')
var renderChunk = require('lib/widgets/chunk')
var SampleTrimmer = require('lib/params/sample-trimmer')
var SampleChooser = require('lib/params/sample-chooser')
var ToggleButton = require('lib/params/toggle-button')
var IndexParam = require('lib/index-param')
var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')

var sliceOptions = [
  ['Equal Slices', 'divide'],
  ['Use Transients', 'transient']
]

var triggerOptions = [
  ['Oneshot', 'slice'],
  ['Play to end', 'full']
]

module.exports = function renderSlicerChunk (node) {
  return renderChunk(node, {
    volume: true,
    main: [
      h('section', [

        h('ParamList', [
          h('div -block -flexSmall', [
            h('div', Range(IndexParam(node.shape, 0), { 
              title: 'rows',
              format: 'bit',
              defaultValue: 1
            }))
          ]),
          h('div -block -flexSmall', [
            h('div', Range(IndexParam(node.shape, 1), { 
              title: 'cols',
              format: 'bit',
              defaultValue: 1
            }))
          ]),
          ToggleButton(FlagParam(node.flags, 'noRepeat'), {
            title: 'Use Repeat', 
            onValue: false,
            offValue: true 
          })
        ])
      ]),

      h('h1', 'Audio Sample'),
      h('section', [

        h('ParamList', [
          SampleChooser(node.sample),
          Select(node.sample.mode, { options: triggerOptions }),
          ModRange(node.sample.amp, {
            title: 'amp',
            format: 'dB',
            flex: 'small'
          }),

          ModRange(node.sample.transpose, {
            title: 'transpose',
            format: 'semitone',
            flex: 'small'
          })
        ]),

        SampleTrimmer(node.sample)
      ]),

      h('h1', 'Slicing'),
      h('section', [
        h('ParamList', [
          Select(node.sliceMode, { options: sliceOptions }),
          ToggleButton(node.chokeAll, {
            title: 'Choke All'
          }),
          ToggleButton(node.stretch, {
            title: 'Timestretch'
          }),
          node.stretch() ? Range(node.tempo, {
            title: 'original bpm',
            format: 'bpm',
            flex: 'small'
          }) : null
        ])
      ]),

      h('h1', 'EQ'),
      h('section', [
        eqParams(node.eq)
      ]),

      h('h1', 'Routing'),
      h('section', [
        h('ParamList', [
          renderRouting(node)
        ])
      ])
    ]
  })
}

function eqParams(node) {
  return h('ParamList', [
    ModRange(node.low, {
      title: 'low',
      defaultValue: 1,
      format: 'dBn',
      flex: 'small'
    }),,
    ModRange(node.mid, {
      title: 'mid',
      defaultValue: 1,
      format: 'dBn',
      flex: 'small'
    }),
    ModRange(node.high, {
      title: 'high',
      defaultValue: 1,
      format: 'dBn',
      flex: 'small'
    }),

    ModRange(node.lowcut, {
      title: 'lowcut',
      format: 'arfo',
      flex: 'small'
    }),

    ModRange(node.highcut, {
      title: 'highcut',
      format: 'arfo',
      flex: 'small'
    })

  ])
}