var h = require('lib/h')
var computed = require('mutant/computed')

var ParamEditor = require('lib/widgets/param-editor')

var Range = require('lib/params/range')
var Text = require('lib/params/text')
var ToggleButton = require('lib/params/toggle-button')
var IndexParam = require('lib/index-param')

var renderNode = require('lib/render-node')
var SlotChooser = require('./slot-chooser')

module.exports = renderTriggersChunk

function renderTriggersChunk (chunk) {
  return h('ChunkNode', [
    h('div.options', [
      h('h1', 'Slots'),
      h('ParamList -compact', [
        shapeParams(chunk.shape)
      ]),
      SlotChooser(chunk, spawnSlot),
      h('h1', 'Chunk Options'),
      h('section.options', [
        h('ParamList', [
          h('div -block', [
            h('div.extTitle', 'Choke Mode'),
            h('div', ToggleButton(chunk.chokeAll, {title: 'All', offTitle: 'Single'}))
          ])
        ])
      ]),
      h('h1', 'Params'),
      ParamEditor(chunk),
      h('h1', 'Publish'),
      Text(chunk.publishedName, {placeholder: 'Published Name', size: 15}),
      Text(chunk.publishedTags, {placeholder: 'bass,funk', size: 15}),
      ToggleButton(chunk.publish, {title: 'publish', offTitle: 'publish'}),
      h('div.publishedUrl', chunk.publishedUrl)
    ]),
    h('div.slot', [
      currentSlotEditor(chunk)
    ])
  ])
}

function shapeParams (param) {
  return [
    h('div -block -flexSmall', [
      h('div', Range(IndexParam(param, 0), {
        title: 'rows',
        format: 'bit',
        defaultValue: 1
      }))
    ]),

    h('div -block -flexSmall', [
      h('div', Range(IndexParam(param, 1), {
        title: 'cols',
        format: 'bit',
        defaultValue: 1
      }))
    ])
  ]
}

function currentSlotEditor (chunk) {
  var slots = chunk.context.slotLookup
  var slotId = computed([chunk.selectedSlotId, slots], function (selected, slots) {
    // wait until slot has loaded, and smooth out changes
    return slots[selected] && slots[selected].id
  })
  return computed(slotId, function (slotId) {
    var slot = slots.get(slotId)
    if (slot) {
      return renderNode(slot)
    }
  })
}

function spawnSlot (ev) {
  var id = ev.id
  var chunk = ev.chunk

  var slot = chunk.slots.push({
    id: ev.id,
    node: 'slot',
    output: 'output'
  })

  chunk.selectedSlotId.set(id)
  return slot
}
