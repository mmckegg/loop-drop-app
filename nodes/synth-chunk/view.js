var h = require('lib/h')
var renderRouting = require('lib/widgets/routing')
var FlagParam = require('lib/flag-param')
var renderChunk = require('lib/widgets/chunk')
var ToggleButton = require('lib/params/toggle-button')
var IndexParam = require('lib/index-param')
var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')
var Select = require('lib/params/select')

var shapeChoices = require('../oscillator/shape-choices')
var filterTypeChoices = [
  ['Lowpass', 'lowpass'],
  ['Highpass', 'highpass'],
  ['Bandpass', 'bandpass']
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

      h('h1', 'Oscillator 1'),
      h('section', [
        oscillatorParams(node.osc1)
      ]),

      h('h1', 'Oscillator 2'),
      h('section', [
        oscillatorParams(node.osc2)
      ]),

      h('h1', 'Oscillator 3'),
      h('section', [
        oscillatorParams(node.osc3)
      ]),

      h('h1', 'Filter'),
      h('section', [
        filterParams(node.filter)
      ]),

      h('h1', 'EQ'),
      h('section', [
        eqParams(node.eq)
      ]),

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

function filterParams(node) {
  return h('ParamList', [
    Select(node.type, {
      defaultValue: 'lowpass',
      options: filterTypeChoices 
    }),

    ModRange(node.frequency, {
      title: 'freq',
      defaultValue: 300,
      format: 'arfo',
      flex: 'small'
    }),
    
    ModRange(node.Q, {
      title: 'Q',
      defaultValue: 1,
      format: 'ratio100',
      flex: 'small'
    })
  ])
}

function oscillatorParams(node) {
  return h('ParamList', [

    Select(node.shape, { 
      options: shapeChoices 
    }),

    ModRange(node.octave, {
      title: 'octave',
      format: 'octave',
      defaultValue: 0,
      flex: 'small'
    }),

    ModRange(node.detune, {
      title: 'detune',
      format: 'cents',
      flex: 'small'
    }),

    ModRange(node.amp, {
      title: 'amp',
      defaultValue: 1,
      format: 'dB',
      flex: 'small'
    })

  ])
}