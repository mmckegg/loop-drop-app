var h = require('micro-css/h')(require('virtual-dom/h'))
var send = require('value-event/event')

var renderCollection = require('../collection.js')

var ChunkOptions = require('./options.js')
//var SlotEditor = require('./slot.js')
var SlotChooser = require('./slot-chooser.js')

var Range = require('lib/params/range')
var ScaleChooser = require('lib/params/scale-chooser')
var IndexParam = require('lib/index-param')
var QueryParam = require('loop-drop-setup/query-param')
var EditableHook = require('lib/editable-hook')

module.exports = renderChunk

var renameLastParam = false

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

    options.push(
      h('h1', 'Params'),
      ParamEditor(chunk)
    )

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

function ParamEditor(chunk){
  var keys = chunk.params()
  var params = keys.map(function(key, i){
    var selected = renameLastParam && i === keys.length-1
    return h('ExternalNode', [
      h('header', [
        h('span.name', {
          'ev-hook': EditableHook(IndexParam(chunk.params, i), selected)
        }),
        h('button.remove Button -warn', {
          'ev-click': send(removeParam, {chunk: chunk, key: key}),
        }, 'X')
      ])
    ])
  })

  return [
    params, 

    h('NodeSpawner', h('button Button -main -spawn', {
      'ev-click': send(spawnParam, chunk)
    }, '+ param'))
  ]
}

function spawnParam(chunk) {
  var key = chunk.resolveAvailableParam('New Param')
  var params = chunk.params().slice()
  params.push(key)
  chunk.params.set(params)

  // wow such hacks!
  renameLastParam = true
  setTimeout(function() {
    renameLastParam = false
  }, 16)
}

function removeParam(target) {
  var params = target.chunk.params().slice()
  var index = params.indexOf(target.key)
  if (~index){
    params.splice(index, 1)
  }
  target.chunk.params.set(params)
}