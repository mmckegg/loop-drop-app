var SlotEditor = require('soundbank-slot-editor')

module.exports = function(element){

  var slotRelease = null
  var slot = null
  var currentDeckId = null

  var editor = SlotEditor(window.context.audio, element)

  window.events.on('setEditorView', function(view){
    element.hidden = (view !== 'visual')
  })

  window.events.on('selectSlot', function(deckId, slotId){

    if (slotRelease){
      slotRelease()
      slotRelease = null
    }

    var deck = window.context.instances[deckId]
    slot = getSlotObserv(deck.mainChunk.slots, slotId)
    currentDeckId = deckId

    slotRelease = slot(display)

    display(slot())
  })

  editor.on('change', function(descriptor){
    slot.set(descriptor)
    window.events.emit('kitChange', currentDeckId)
  })

  function display(descriptor){
    editor.set(descriptor)
  }

}

function getSlotObserv(slots, id){
  var result = null
  slots.some(function(slot){
    if (typeof slot === 'function' && slot().id == id){
      result = slot
      return true
    }
  })
  return result
}