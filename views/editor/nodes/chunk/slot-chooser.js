var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

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

      if (slot){
        triggers.push(
          h('div.slot', {
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