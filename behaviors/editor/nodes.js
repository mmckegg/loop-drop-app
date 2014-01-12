var become = require('become')
var render = require('../../views').nodeEditor
var jsonQuery = require('json-query')

var relativeQuery = /^[\.\[:]/

var dataFilters = {
  path: function(input){
    var result = ''
    if (input){
      result = this.query
      if (this.parentContext && relativeQuery.exec(result)){
        result = dataFilters.path.call(this.parentContext, this.parentContext.source) + result
      }
    }
    return result
  }
}

module.exports = function(container){
  var currentDeck = null
  var current = {
    slot: null,
    id: null,
    deckId: null
  }

  window.events.on('selectSlot', function(deckId, slotId){

    current.deckId = deckId
    current.id = String(slotId)

    var deck = window.context.decks[deckId]
    if (deck != currentDeck){
      if (currentDeck){
        deck.removeListener('change', handleData)
      }
      currentDeck = deck
      currentDeck.on('change', handleData)
    }

    current.slot = deck.getDescriptor(slotId)
    update()
  })

  function get(query){
    return jsonQuery(query, this).value
  }

  window.events.on('updateActiveSlot', function(path, value){
    var newObject = obtain(current.slot)
    var res = jsonQuery(path, {rootContext: newObject})
    if (res.key != null){
      var obj = jsonQuery.lastParent(res)
      if (obj){
        obj[res.key] = value
      }
    }
    currentDeck.update(newObject)
    window.events.emit('kitChange', current.deckId)
  })

  function update(){
    var newContent = render({get: get, rootContext: current.slot, filters: dataFilters})
    become(container, newContent, {inner: true, onChange: window.behave})
  }

  function handleData(data){
    var activeEditor = getNodeEditorElement(document.activeElement)
    if (data.id == current.id){
      current.slot = data
      if (activeEditor !== container){
        update()
      }
    }
  }
}

function getNodeEditorElement(node){
  while (node && !node.classList.contains('NodeEditor')){
    node = node.parentNode
    if (node === document) { 
      node = null 
    }
  }
  return node
}

function obtain(obj){
  return JSON.parse(JSON.stringify(obj))
}