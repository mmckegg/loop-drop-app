module.exports = function(container){
  var outputLookup = {}
  var selectedElement = null
  var elementLookup = {}

  var deckElement = getIdElement(container)
  var thisDeckId = deckElement && deckElement.getAttribute('data-id')

  // set up lookup
  for (var i=0;i<container.children.length;i++){
    var slot = container.children[i]
    elementLookup[slot.getAttribute('data-id')] = slot
    slot.activeCount = 0
  }

  window.context.decks[thisDeckId].on('data', function(event){
    var element = elementLookup[event.data[1]]
    if (element){
      if (event.data[2]){
        element.classList.add('-active')
      } else {
        element.classList.remove('-active')
      }
    }
    var outputElement = outputLookup[event.data[1]]
    if (outputElement){
      if (event.data[2]){
        outputElement.activeCount += 1
      } else {
        outputElement.activeCount -= 1
      }

      if (outputElement.activeCount > 0){
        outputElement.classList.add('-inputActive')
      } else {
        outputElement.classList.remove('-inputActive')
      }
    }
  })

  window.context.decks[thisDeckId].on('change', function(descriptor){
    var element = elementLookup[descriptor.id]
    if (element){

      if (descriptor.sources && descriptor.sources.length){
        element.classList.add('-present')
      } else {
        element.classList.remove('-present')
      } 

      if (descriptor.sources && descriptor.sources.$){
        element.classList.add('-linked')
      } else {
        element.classList.remove('-linked')
      }

      if (descriptor.downAction || descriptor.upAction){
        element.classList.add('-action')
      } else {
        element.classList.remove('-action')
      }
    }

    outputLookup[descriptor.id] = elementLookup[descriptor.output] || null
  })

  window.events.on('selectSlot', function(deckId, slotId){
    if (selectedElement){
      selectedElement.classList.remove('-selected')
      selectedElement = null
    }

    if (deckId == thisDeckId){
      selectedElement = elementLookup[slotId]
      if (selectedElement){
        selectedElement.classList.add('-selected')
      }
    }
  })

  container.addEventListener('mousedown', function(e){
    var slot = getIdElement(e.target)
    if (slot){
      window.events.emit('selectSlot', thisDeckId, slot.getAttribute('data-id'))
    }
  })
}


function getIdElement(node){
  while (node && !node.getAttribute('data-id')){
    node = node.parentNode
  }
  return node
}