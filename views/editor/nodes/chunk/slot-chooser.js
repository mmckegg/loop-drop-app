var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var MPE = require('../../../../lib/mouse-position-event.js')
var nextTick = require('next-tick')

module.exports = renderOptions

function renderOptions(chunk){

  var triggers = []

  var shape = chunk.shape() || [1,1]
  var selectedSlotId = chunk.selectedSlotId()
  var slots = chunk.context.slotLookup

  if (chunk.templateSlot){
    triggers.push(
      h('div.slot', {
        'style': {width: width},
        'className': selectedSlotId === '$template' ? '-selected' : '',
        'ev-click': mercury.event(selectTemplateSlot, chunk)
      }, 'template trigger')
    )
  } else {
    
    var length = shape[0] * shape[1]
    for (var i=0;i<length;i++){
      var id = String(i)
      var slot = slots.get(id)
      var width = (100 / shape[1]) + '%'
      var dragInfo = { collection: chunk.slots, id: id, select: chunk.selectedSlotId.set }

      if (slot){
        triggers.push(
          h('div.slot', {
            'draggable': true,

            'ev-dragstart': MPE(dragStart, dragInfo),
            'ev-dragend': MPE(dragEnd, dragInfo),
            'ev-dragover': MPE(dragOver, dragInfo),
            'ev-dragleave': MPE(dragLeave, dragInfo),
            'ev-drop': MPE(drop, dragInfo),

            'style': {width: width},
            'className': selectedSlotId === id ? '-selected' : '',
            'ev-click': mercury.event(chunk.selectedSlotId.set, id)
          }, [
            id,
            h('button.remove', {
              'ev-click': mercury.event(chunk.slots.remove, slot),
            }, 'X')
          ])
        )
      } else {
        triggers.push(
          h('div.slot -spawn', {
            'style': {width: width},

            'ev-dragover': MPE(dragOver, dragInfo),
            'ev-dragleave': MPE(dragLeave, dragInfo),
            'ev-drop': MPE(drop, dragInfo),

            'ev-click': mercury.event(spawnSlot, { id: id, chunk: chunk })
          }, '+ trigger')
        )
      }
    }

  }

  return h('SlotChooser', [
    triggers, 
    h('div.spacer'),
    h('div.slot -output', {
      'className': selectedSlotId === 'output' ? '-selected' : '',
      'ev-click': mercury.event(chunk.selectedSlotId.set, 'output')
    }, 'output')
  ])
}

function selectTemplateSlot(chunk){
  var data = chunk.templateSlot()
  if (!data || !data.node){
    chunk.templateSlot.set({ node: 'slot', output: 'output' })
  }
  chunk.selectedSlotId.set('$template')
}

function spawnSlot(ev){
  var id = ev.id
  var chunk = ev.chunk

  chunk.slots.push({
    id: ev.id,
    node: 'slot',
    output: 'output'
  })

  chunk.selectedSlotId.set(id)
}

var currentDrag = null

function dragStart(ev){
  currentDrag = ev.data
}

function dragEnd(ev){
  currentDrag = null
}

function dragOver(ev){
  ev.currentTarget.classList.add('-dragOver')
  if (ev.altKey){
    ev.dataTransfer.dropEffect = 'copy'
  } else {
    ev.dataTransfer.dropEffect = 'move'
  }
  ev.event.preventDefault()
}

function drop(ev){
  var sourceCollection = currentDrag.collection
  var targetCollection = ev.data.collection

  var sourceLookup = sourceCollection.context.slotLookup
  var targetLookup = targetCollection.context.slotLookup

  var source = targetLookup.get(currentDrag.id)
  var target = sourceLookup.get(ev.data.id)

  var isCopying = ev.altKey

  if (source && source !== target){

    if (target){
      // clear out existing
      targetCollection.remove(target)
    }

    if (sourceCollection !== targetCollection || isCopying){

      // move to different collection
      var descriptor = obtainWithId(ev.data.id, source())

      if (!isCopying){
        sourceCollection.remove(source)
      }

      targetCollection.push(descriptor)
    
    } else {
      source.id.set(ev.data.id)
    }

    ev.data.select(ev.data.id)
  }

  dragLeave(ev)
}

function dragLeave(ev){
  ev.currentTarget.classList.remove('-dragOver')
}

function obtainWithId(id, obj){
  obj = JSON.parse(JSON.stringify(obj))
  obj.id = id
  return obj
}