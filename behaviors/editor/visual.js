var SlotEditor = require('soundbank-slot-editor')

module.exports = function(element){

  var current = null
  var currentSlotId = null

  var editor = SlotEditor(window.context.audio, element)

  window.events.on('setEditorView', function(view){
    element.hidden = (view !== 'visual')
  })

  window.events.on('selectSlot', function(deckId, slotId){

    var soundbank = window.context.instances[deckId]
    var descriptor = soundbank.getDescriptor(slotId)

    if (soundbank != current){
      if (current){
        soundbank.removeListener('change', display)
      }
      current = soundbank
      current.on('change', display)
    }

    currentSlotId = slotId

    display(soundbank.getDescriptor(slotId))
  })

  editor.on('change', function(descriptor){
    current.update(descriptor)
  })

  function display(descriptor){
    if (descriptor.id == currentSlotId){
      editor.set(descriptor)
    }
  }

}