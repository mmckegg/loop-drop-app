var JSMN = require('../../lib/jsmn')
var ace = require('brace')
require('brace/mode/javascript');
require('brace/theme/ambiance');

module.exports = function(element){

  var enabled = false
  var slot = null
  var slotRelease = null
  var currentDeckId = null

  var editorElement = element.parentNode
  
  window.events.on('setEditorView', function(view){
    if (view === 'raw'){
      editorElement.hidden = false
      enabled = true
      update()
    } else {
      editorElement.hidden = true
      enabled = false
    }
  })

  window.events.on('selectSlot', function(deckId, slotId){

    if (deckId != currentDeckId){
      editorElement.parentNode.classList.add('-' + deckId)
      editorElement.parentNode.classList.remove('-' + currentDeckId)
    }

    if (slotRelease){
      slotRelease()
      slotRelease = null
    }

    var deck = window.context.instances[deckId]
    currentDeckId = deckId
    slot = getSlotObserv(deck.mainChunk.slots, slotId)

    var slotRelease = slot(handleData)

    update()
  })

  var textEditor = ace.edit(element)
  textEditor.setTheme('ace/theme/ambiance');
  textEditor.session.setMode('ace/mode/javascript')
  textEditor.session.setUseWorker(false)
  textEditor.session.setTabSize(2)
  textEditor.renderer.setShowGutter(false)
  //textEditor.setSize('100%', '100%')

  var lastValue = null
  var updating = false

  function update(){
    if (!updating){
      updating = true
      window.requestAnimationFrame(function(cb){
        var data = slot && slot()
        if (data){
          textEditor.setValue(JSMN.stringify(data),-1)
        } else {
          textEditor.setValue('',-1)
        }
        lastValue = textEditor.getValue()
        updating = false
      })
    }
  }

  function save(){
    var value = textEditor.getValue()
    if (!updating && value != lastValue && slot){
      lastValue = value
      try {
        var object = JSMN.parse(value)
        object.id = slot().id
        slot.set(object)
        window.events.emit('kitChange', currentDeckId)
      } catch (ex) {}
    }
  }

  function handleData(data){
    if (enabled){
      if (!textEditor.isFocused()){
        update(data)
      }
    }
  }

  textEditor.on('blur', update)
  textEditor.on('change', save)
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