var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var renderCollection = require('../collection.js')

var ChunkOptions = require('./options.js')
//var SlotEditor = require('./slot.js')
var SlotChooser = require('./slot-chooser.js')

var Range = require('lib/params/range')
var ScaleChooser = require('lib/params/scale-chooser')
var IndexParam = require('lib/index-param')
var QueryParam = require('loop-drop-setup/query-param')

module.exports = renderChunk

function renderChunk(chunk){
  if (chunk){
    //var slotEditor = SlotEditor(chunk)

    var options = [
      h('h1', 'Slots'),

      chunk.templateSlot ? null : h('ParamList -compact', [
        shapeParams(chunk.shape)
      ]),

      SlotChooser(chunk),

      h('h1', 'Chunk Options'),
      ChunkOptions(chunk)

    ]

    if (chunk.scale){
      options.push(
        h('h1', 'Scale'),
        renderScaleChooser(chunk)
      )
    }

    return h('ChunkNode', [

      h('div.options', options),

      h('div.slot', [
        currentSlotEditor(chunk)
      ])

    ])
  }
}

function renderScaleChooser(node){
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

function shapeParams(param){
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

function currentSlotEditor(chunk){
  var renderNode = require('../')
  var slotId = chunk.selectedSlotId()
  if (chunk.templateSlot && slotId === '$template'){
    return renderNode(chunk.templateSlot.node)
  } else {
    var slots = chunk.context.slotLookup
    var slot = slots.get(slotId)
    if (slot){
      return renderNode(slot)
    }
  }
}