module.exports = function(slot){
  slot.addEventListener('dragover', onDragOver, false)
  slot.addEventListener('drop', onDrop, false)
  slot.addEventListener('dragenter', onDragEnter, false)
  slot.addEventListener('dragleave', onDragLeave, false)
  slot.addEventListener('dragstart', onDragStart, false)
  slot.addEventListener('dragend', onDragEnd, false)
}

function onDragStart(event){
  window.currentDrag = getSlotElement(event.target)
}

function onDragEnd(event){
  window.currentDrag = null
}

function onDragOver(event){
  event.preventDefault()
  if (window.currentDrag && event.shiftKey){
    event.dataTransfer.dropEffect = 'link'
  } else if (event.altKey){
    event.dataTransfer.dropEffect = 'copy'
  } else {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onDrop(event){
  event.stopPropagation()
  event.preventDefault()
  this.classList.remove('-dragover')

  var destinationDeckId = getDeckElement(event.target).getAttribute('data-id')
  var destinationId = getSlotElement(event.target).getAttribute('data-id')
  var destinationDeck = window.context.instances[destinationDeckId]

  if (window.currentDrag){

    var fromDeckId = getDeckElement(window.currentDrag).getAttribute('data-id')
    var fromId = getSlotElement(window.currentDrag).getAttribute('data-id')
    var fromDeck = window.context.instances[fromDeckId]

    var descriptor = fromDeck.getDescriptor(fromId)

    if (event.shiftKey){

      if (destinationDeckId == fromDeckId){
        descriptor.output = destinationId
        fromDeck.update(descriptor)
        window.events.emit('kitChange', fromDeckId)
      }

    } else if (!(fromDeckId == destinationDeckId && fromId == destinationId)){

      var newDescriptor = obtain(descriptor)
      newDescriptor.id = destinationId

      destinationDeck.update(newDescriptor)

      if (!event.altKey){ // remove old
        fromDeck.update({id: fromId})
        if (fromDeckId !== destinationDeckId){
          window.events.emit('kitChange', fromDeckId)
        }
      }

      window.events.emit('selectSlot', destinationDeckId, destinationId)
      window.events.emit('kitChange', destinationDeckId)
    }

  } else if (event.dataTransfer.files.length == 1) {
    window.events.emit('dropFileOnSlot', event.dataTransfer.files[0], destinationDeckId, destinationId)
  }
}

function obtain(obj){
  return JSON.parse(JSON.stringify(obj))
}

function onDragEnter(event){
  this.classList.add('-dragover')
}

function onDragLeave(event){
  this.classList.remove('-dragover')
}

function getDeckElement(node){
  while (node && !node.classList.contains('Deck')){
    node = node.parentNode
  }
  return node
}


function getSlotElement(node){
  while (node && !node.getAttribute('data-id')){
    if (node.classList.contains('Kit')) { // too far
      return false
    }
    node = node.parentNode
  }
  return node
}