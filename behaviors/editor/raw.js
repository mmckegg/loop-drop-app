var JSMN = require('../../lib/jsmn')
var ace = require('brace')
require('brace/mode/javascript');
require('brace/theme/ambiance');

module.exports = function(element){

  var currentId = null
  var currentDeckId = null
  var currentDeck = null

  var editorElement = element.parentNode

  window.events.on('selectSlot', function(deckId, slotId){

    if (deckId != currentDeckId){
      editorElement.classList.add('-' + deckId)
      editorElement.classList.remove('-' + currentDeckId)
    }

    currentDeckId = deckId
    currentId = String(slotId)

    var deck = window.context.decks[deckId]
    if (deck != currentDeck){
      if (currentDeck){
        deck.removeListener('change', handleData)
      }
      currentDeck = deck
      currentDeck.on('change', handleData)
    }

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
        if (currentDeckId && currentId){
          var descriptor = window.context.decks[currentDeckId].getDescriptor(currentId)
          textEditor.setValue(JSMN.stringify(descriptor),-1)
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
    if (!updating && value != lastValue && currentDeck){
      lastValue = value
      try {
        var object = JSMN.parse(value)
        object.id = currentId
        currentDeck.update(object)
        window.events.emit('kitChange', currentDeckId)
      } catch (ex) {}
    }
  }

  function handleData(data){
    if (data.id == currentId){
      if (!textEditor.isFocused()){
        update()
      }
    }
  }

  textEditor.on('blur', update)
  textEditor.on('change', save)
}