var h = require('lib/h')
var send = require('@mmckegg/mutant/send')
var when = require('@mmckegg/mutant/when')
var computed = require('@mmckegg/mutant/computed')
var ParamEditor = require('lib/widgets/param-editor')
var Range = require('lib/params/range')
var ToggleButton = require('lib/params/toggle-button')
var ScaleChooser = require('lib/params/scale-chooser')
var QueryParam = require('lib/query-param')
var renderNode = require('lib/render-node')

module.exports = renderChromaticChunk

function renderChromaticChunk (chunk) {
  var customScale = computed(chunk.scale, value => value !== '$global')
  return h('ChunkNode', [
    h('div.options', [
      h('h1', 'Slots'),
      h('SlotChooser', [
        h('div.slot', {
          'classList': computed(chunk.selectedSlotId, s => s === '$template' ? '-selected' : ''),
          'ev-click': send(selectTemplateSlot, chunk)
        }, 'template trigger'),
        h('div.spacer'),
        h('div.slot -output', {
          'classList': computed(chunk.selectedSlotId, s => s === 'output' ? '-selected' : ''),
          'ev-click': send(chunk.selectedSlotId.set, 'output')
        }, 'output')
      ]),

      h('h1', 'Chunk Options'),
      h('section.options', [
        h('ParamList', [
          h('div -block', [
            h('div.extTitle', 'Choke Mode'),
            h('div', ToggleButton(chunk.chokeAll, {title: 'All', offTitle: 'Single'}))
          ])
        ])
      ]),

      when(customScale, [
        h('h1', 'Scale'),
        renderScaleChooser(chunk)
      ]),

      h('h1', 'Params'),
      ParamEditor(chunk)
    ]),

    h('div.slot', [
      currentSlotEditor(chunk)
    ])
  ])
}

function renderScaleChooser (node) {
  return h('ParamList -compact', [
    ScaleChooser(QueryParam(node.scale, 'notes', {})),
    Range(QueryParam(node.scale, 'offset', {}), {
      title: 'offset',
      format: 'semitone',
      defaultValue: 0,
      width: 200,
      flex: true
    })
  ])
}

function currentSlotEditor (chunk) {
  var slots = chunk.context.slotLookup
  var slotId = computed([chunk.selectedSlotId, slots], function (selected, slots) {
    // wait until slot has loaded, and smooth out changes
    if (selected === '$template') {
      return selected
    } else {
      return slots[selected] && slots[selected].id
    }
  })
  return computed(slotId, function (slotId) {
    if (slotId === '$template') {
      return renderNode(chunk.templateSlot.node)
    } else {
      var slot = slots.get(slotId)
      if (slot) {
        return renderNode(slot)
      }
    }
  })
}

function selectTemplateSlot (chunk) {
  var data = chunk.templateSlot()
  if (!data || !data.node) {
    chunk.templateSlot.set({
      id: { $param: 'id' },
      noteOffset: {
        node: 'modulator/scale',
        value: { $param: 'value' },
        offset: { $param: 'offset' },
        scale: { $param: 'scale' }
      },
      node: 'slot',
      output: 'output'
    })
  }
  chunk.selectedSlotId.set('$template')
}
