var h = require('lib/h')
var Header = require('lib/widgets/header')
var ToggleButton = require('lib/params/toggle-button')
var ModRange = require('lib/params/mod-range')
var EditableHook = require('lib/editable-hook')
var updateParamReferences = require('lib/update-param-references')

module.exports = function renderLfo (node) {
  return h('ModulatorNode -lfo', [
    Header(node, h('span', [
      h('strong', 'Envelope:'), ' ',
      h('span', {
        hooks: [ EditableHook(node.id, {
          onChange: onRename,
          formatter: node.context.collection.resolveAvailable
        }) ]
      })
    ])),
    h('ParamList', [
      ToggleButton(node.retrigger, {
        title: 'Retrigger'
      }),

      ModRange(node.value, {
        flex: true,
        title: 'multiplier',
        defaultValue: 1,
        format: 'ratio'
      }),

      ModRange(node.attack, {
        flex: true,
        title: 'attack',
        defaultValue: 0,
        format: 'ms'
      }),

      ModRange(node.decay, {
        flex: true,
        title: 'decay',
        defaultValue: 0,
        format: 'ms'
      }),

      ModRange(node.sustain, {
        flex: true,
        defaultValue: 0.5,
        title: 'sustain',
        format: 'ratio'
      }),

      ModRange(node.release, {
        flex: true,
        defaultValue: 0,
        title: 'release',
        format: 'ms'
      })
    ])
  ])
}

function onRename (lastValue, value, param) {
  updateParamReferences(param.context.slot, lastValue, value)
}
