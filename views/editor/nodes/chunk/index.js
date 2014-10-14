var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var renderCollection = require('../collection.js')

var ChunkOptions = require('./options.js')
var SlotEditor = require('./slot.js')

module.exports = renderChunk

function renderChunk(fileObject){
  if (fileObject){
    var data = fileObject()
    var slotEditor = data.node == 'rangeChunk' ? SlotEditor(fileObject.getParam('triggerSlot')) : null

    return h('ChunkNode', [
      ChunkOptions(fileObject),
      slotEditor
    ])
  }
}