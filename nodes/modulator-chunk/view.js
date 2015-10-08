var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')

var Range = require('lib/params/range')
var ModRange = require('lib/params/mod-range')
var ToggleButton = require('lib/params/toggle-button')

var IndexParam = require('lib/index-param')
var FlagParam = require('lib/flag-param')
var renderChunk = require('lib/widgets/chunk')

module.exports = function renderModulatorChunk (node) {
  var slotLookup = node.context.slotLookup
  var elements = []
  var shape = node.shape()
  var length = shape[0] * shape[1]

  for (var i = 0; i < length; i++) {
    var id = String(i)
    var slot = slotLookup.get(id)
    if (slot) {
      elements.push(h('div.slot -trigger', [
        h('strong', id + ': '),
        ModRange(slot.value, { flex: true, format: 'offset', defaultValue: 0 }),
        h('button.remove Button -warn', {
          'ev-click': send(node.slots.remove, slot)
        }, 'X')
      ]))
    } else {
      elements.push(h('div.slot -spawn', {
        'ev-click': send(spawnSlot, { id: id, collection: node.slots })
      }, ['+ trigger']))
    }
  }

  return renderChunk(node, {
    main: [
      h('section', [
        h('div ParamList', [
          shapeParams(node.shape),
          ToggleButton(FlagParam(node.flags, 'noRepeat'), {
            title: 'Use Repeat',
            onValue: false,
            offValue: true
          })
        ]),
        h('ValueSlots', elements)
      ])
    ]
  })
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

function spawnSlot (ev) {
  var collection = ev.collection
  collection.push({
    node: 'slot/value',
    id: ev.id,
    value: 0
  })
}
