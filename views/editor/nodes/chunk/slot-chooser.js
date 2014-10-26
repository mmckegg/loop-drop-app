var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

module.exports = renderOptions

function renderOptions(fileObject){
  var data = fileObject()
  if (data){
    var param = fileObject.getParam
    var slots = null

    if (data.node === 'chunk'){
      slots = gridSlots(fileObject)
    } else if (data.node === 'chunk/range'){
      slots = rangeSlots(fileObject)
    }

    return h('SlotChooser', slots)
  }

}

function gridSlots(fileObject){
  var triggers = []
  var busses = []
  var data = fileObject()
  var shape = data.shape || [1,1]
  var length = shape[0] * shape[1]
  for (var i=0;i<length;i++){
    triggers.push(triggerSlot(String(i), fileObject))
  }
  return [
    triggers, 
    busses,
    h('div.spacer'),
    h('div.slot -addBus', 'Add Bus'),
    triggerSlot('output', fileObject)
  ]
}

function rangeSlots(fileObject){

  var triggers = [
    triggerSlot('trigger', fileObject)
  ]

  var busses = []
  return [
    triggers,
    h('div.spacer'),
    busses,
    h('div.slot -addBus', 'Add Bus'),
    triggerSlot('output', fileObject)
  ]
}

function triggerSlot(id, fileObject){
  var target = fileObject.getParam('selectedSlotId')
  var selectedSlotId = target.read()
  if (selectedSlotId == null){
    selectedSlotId = fileObject().node === 'rangeChunk' ? 'trigger' : '0'
  }

  var selected = selectedSlotId == id
  var classes = '-trigger'

  if (selectedSlotId == null){
    selectedSlotId = data.node === 'rangeChunk' ? 'trigger' : '0'
  }

  if (id == 'output') classes += ' -output'
  if (selected) classes += ' -selected'

  return h('div.slot', {
    'className': classes,
    'ev-click': mercury.event(set, {param: target, value: id})
  }, id)
}

function set(data){
  data.param.set(data.value)
}