var h = require('lib/h')
var when = require('mutant/when')
var Header = require('lib/widgets/header')
var ToggleButton = require('lib/params/toggle-button')
var ModRange = require('lib/params/mod-range')
var Range = require('lib/params/range')
var Select = require('lib/params/select')
var EditableHook = require('lib/editable-hook')
var updateParamReferences = require('lib/update-param-references')

var modeOptions = [
  ['Add', 'add'],
  ['Multiply', 'multiply']
]

module.exports = function renderLfo (node) {
  return h('ModulatorNode -lfo', [
    Header(node, h('span', [
      h('strong', 'LFO:'), ' ',
      h('span', {
        hooks: [ EditableHook(node.id, { onChange: onRename }) ]
      })
    ])),
    h('ParamList', [
      ToggleButton(node.sync, {
        title: 'BPM Sync'
      }),

      ToggleButton(node.trigger, {
        title: 'Retrigger'
      }),

      Select(node.mode, {
        options: modeOptions
      }),

      ModRange(node.value, {
        flex: true,
        title: 'centre',
        defaultValue: 0.5,
        format: 'ratio1'
      }),

      ModRange(node.amp, {
        flex: true,
        defaultValue: 0.5,
        title: 'amplitude',
        format: 'ratio1'
      }),

      when(node.sync,
        ModRange(node.rate, {
          flex: true,
          defaultValue: 1,
          title: 'rate',
          format: 'beat'
        }),
        ModRange(node.rate, {
          flex: true,
          defaultValue: 1,
          title: 'rate',
          format: 'lfo'
        })
      ),

      ModRange(node.phaseOffset, {
        defaultValue: 0,
        title: 'phase offset',
        format: 'offset1',
        flex: true
      }),

      Range(node.skew, {
        defaultValue: 0,
        title: 'skew',
        format: 'offset1',
        flex: true
      }),

      Range(node.curve, {
        defaultValue: 1,
        title: 'curve',
        format: 'ratio1',
        flex: true
      })
    ])
  ])
}

function onRename (lastValue, value, param) {
  updateParamReferences(param.context.slot, lastValue, value)
}
