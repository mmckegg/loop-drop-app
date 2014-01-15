module.exports = function(container){
  var outputLookup = {}
  var inheritedLookup = {}

  var selectedElement = null
  var elementLookup = {}
  var descriptors = {}

  var deckElement = getIdElement(container)
  var thisDeckId = deckElement && deckElement.getAttribute('data-id')

  window.events.on('startSampling', function(deckId){
    if (thisDeckId === deckId){
      container.classList.add('-sampling')
    }
  })

  window.events.on('stopSampling', function(deckId){
    if (thisDeckId === deckId){
      container.classList.remove('-sampling')
    }
  })

  window.events.on('beginRecordSlot', function(deckId, slotId){
    if (thisDeckId === deckId){
      var element = elementLookup[slotId]
      element.classList.add('-recording')
    }
  }).on('endRecordSlot', function(deckId, slotId){
    var element = elementLookup[slotId]
    element.classList.remove('-recording')
  })

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

      if (descriptor.type === 'inherit'){
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
    updateDescriptor(descriptor)
    refreshOutput(descriptor.id)
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

  function getOutput(id){
    var descriptor = descriptors[id]
    if (descriptor){
      if ('output' in descriptor){
        return descriptor.output
      } else if (descriptor.type === 'inherit' && descriptor.from != id) {
        return getOutput(descriptor.from)
      }
    }
    return null
  }

  function refreshOutput(id){
    var output = getOutput(id)
    var element = elementLookup[output] || null
    outputLookup[id] = element
  }

  function updateDescriptor(descriptor){

    var id = String(descriptor.id)
    var oldDescriptor = descriptors[id] || { id: id }

    if (descriptor.type === 'inherit' && descriptor.from != oldDescriptor.from){
      inheritedLookup[descriptor.from] = inheritedLookup[descriptor.from] || []
      if (!~inheritedLookup[descriptor.from].indexOf(id)){
        inheritedLookup[descriptor.from].push(id)
      }
      var oldLookup = inheritedLookup[oldDescriptor.from]
      if (oldLookup){
        var index = oldLookup.indexOf(id)
        if (~index){
          oldLookup.splice(index, 1)
        }
      }
    }

    descriptors[descriptor.id] = descriptor

    process.nextTick(function(){
      var inherited = inheritedLookup[id]
      if (inherited){
       inherited.forEach(refreshOutput)
      } 
   })
  }

}


function getIdElement(node){
  while (node && !node.getAttribute('data-id')){
    node = node.parentNode
  }
  return node
}