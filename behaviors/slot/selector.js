module.exports = function(container){
  var outputLookup = {}
  var inheritedLookup = {}

  var selectedElement = null
  var elementLookup = {}
  var descriptors = {}

  var deckElement = getIdElement(container)
  var thisDeckId = deckElement && deckElement.getAttribute('data-id')

  var pendingIds = []
  var pendingDeckUpdate = false
  var refreshing = false
  var slotState = {
    active: {},
    present: {},
    recording: {},
    inputActive: {},
    meddler: {},
    modulator: {},
    linked: {},
    action: {},
    selected: null
  }

  var deckState = {
    sampling: false
  }

  function refresh(){

    if (pendingDeckUpdate){
      if (deckState.sampling){
        container.classList.add('-sampling')
      } else {
        container.classList.remove('-sampling')
      }

    }

    for (var i=0;i<pendingIds.length;i++){
      var id = pendingIds[i]
      var element = elementLookup[id]

      if (element){
        if (slotState.selected === id){
          element.classList.add('-selected')
        } else {
          element.classList.remove('-selected')
        }

        if (slotState.recording[id]){
          element.classList.add('-recording')
        } else {
          element.classList.remove('-recording')
        }

        if (slotState.present[id]){
          element.classList.add('-present')
        } else {
          element.classList.remove('-present')
        }

        if (slotState.active[id]){
          element.classList.add('-active')
        } else {
          element.classList.remove('-active')
        }

        if (slotState.modulator[id]){
          element.classList.add('-modulator')
        } else {
          element.classList.remove('-modulator')
        }

        if (slotState.inputActive[id]){
          element.classList.add('-inputActive')
        } else {
          element.classList.remove('-inputActive')
        }

        if (slotState.linked[id]){
          element.classList.add('-linked')
        } else {
          element.classList.remove('-linked')
        }

        if (slotState.meddler[id]){
          element.classList.add('-meddler')
        } else {
          element.classList.remove('-meddler')
        }


        if (slotState.action[id]){
          element.classList.add('-action')
        } else {
          element.classList.remove('-action')
        }
      }

    }

    pendingDeckUpdate = false
    pendingIds = []
    refreshing = false
  }

  function requestRefresh(id){
    if (id){
      pendingIds.push(id)
    } else {
      pendingDeckUpdate = true
    }

    if (!refreshing){
      refreshing = true
      window.requestAnimationFrame(refresh)
    }
  }

  window.events.on('startSampling', function(deckId){
    if (thisDeckId === deckId){
      deckState.sampling = true
      requestRefresh()
    }
  })

  window.events.on('stopSampling', function(deckId){
    if (thisDeckId === deckId){
      deckState.sampling = false
      requestRefresh()
    }
  })

  window.events.on('beginRecordSlot', function(deckId, slotId){
    if (thisDeckId === deckId){
      slotState.recording[slotId] = true
      requestRefresh(slotId)
    }
  }).on('endRecordSlot', function(deckId, slotId){
    if (thisDeckId === deckId){
      slotState.recording[slotId] = false
      requestRefresh(slotId)
    }
  })

  // set up lookup
  for (var i=0;i<container.children.length;i++){
    var slot = container.children[i]
    elementLookup[slot.getAttribute('data-id')] = slot
    slot.activeCount = 0
  }

  window.context.triggerOutput.on('data', function(data){
    var id = getLocalId(data.id, thisDeckId)
    if (id){
      var outputId = getOutput(id)
      var increment = 0 

      if (data.event === 'start'){
        increment = 1
        slotState.active[id] = true
      } else if (data.event === 'stop'){
        increment = -1
        slotState.active[id] = false
      }

      slotState.inputActive[outputId] = Math.max(0, (slotState.inputActive[outputId] || 0) + increment)
      requestRefresh(id)
      outputId && requestRefresh(outputId)
    }
  })

  window.context.soundbank.on('change', function(descriptor){
    var parts = descriptor.id.split('#')
    if (parts[0] === thisDeckId){
      var id = parts[1]

      slotState.present[id] = !!(descriptor.sources && descriptor.sources.length)
      slotState.linked[id] = descriptor.node === 'inherit'
      slotState.meddler[id] = descriptor.inputMode === 'meddler'
      slotState.modulator[id] = descriptor.node === 'modulator'

      slotState.action[id] = !!(descriptor.downAction || descriptor.upAction || descriptor.inputMode)

      updateDescriptor(descriptor)
      requestRefresh(id)
    }
  })

  window.events.on('selectSlot', function(deckId, slotId){
    if (deckId == thisDeckId){
      var lastSelected = slotState.selected
      slotState.selected = slotId

      lastSelected && requestRefresh(lastSelected)
      requestRefresh(slotId)
    }
  })

  container.addEventListener('mousedown', function(e){
    var slot = getIdElement(e.target)
    if (slot){
      window.events.emit('selectSlot', thisDeckId, slot.getAttribute('data-id'))
    }
  })

  function getOutput(id){
    var descriptor = descriptors[thisDeckId + '#' + id]
    if (descriptor){
      var from = getLocalId(descriptor.from, thisDeckId)
      if ('output' in descriptor){
        return getLocalId(descriptor.output, thisDeckId)
      } else if (descriptor.node === 'inherit' && from != id) {
        return getOutput(from)
      }
    }
    return null
  }

  function updateDescriptor(descriptor){
    var id = String(descriptor.id)
    var oldDescriptor = descriptors[id] || { id: id }

    if (descriptor.node === 'inherit' && descriptor.from != oldDescriptor.from){
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
  }

}


function getIdElement(node){
  while (node && !node.getAttribute('data-id')){
    node = node.parentNode
  }
  return node
}

function getLocalId(id, namespace){
  if (typeof id === 'string'){
    var parts = id.split('#')
    if (parts[0] === namespace){
      return parts[1]
    }
  }
}