var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var renderCollection = require('../collection.js')

var ChunkOptions = require('./options.js')
var SlotEditor = require('./slot.js')
var SlotChooser = require('./slot-chooser.js')

module.exports = renderChunk

function renderChunk(fileObject){
  if (fileObject){
    var data = fileObject()
    var slotEditor = SlotEditor(getSelectedSlotParam(fileObject))

    return h('ChunkNode', [
      ChunkOptions(fileObject),
      SlotChooser(fileObject),
      slotEditor
    ])
  }
}

var matchTriggers = /[0-9]+/

function getSelectedSlotParam(fileObject){
  var data = fileObject()
  var selectedSlotId = data.selectedSlotId
  if (selectedSlotId == null){
    selectedSlotId = data.node === 'chunk/range' ? 'trigger' : '0'
  }

  if (selectedSlotId.match(matchTriggers)){
    return fileObject.getParam(['triggerSlots[?]', parseInt(selectedSlotId)], [])
  } else if (selectedSlotId === 'trigger'){
    return fileObject.getParam('triggerSlots[0]', [])
  } else {
    return fileObject.getParam(['slots[id=?]', selectedSlotId])
  }

}