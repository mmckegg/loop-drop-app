module.exports = function(element){
  element.addEventListener('mousedown', onMouseDown)
}

var startId = null
var targetId = null
var currentKit = null
var fillSelection = null
var deckId = null

function onMouseDown(event){
  event.preventDefault()
  event.stopPropagation()

  document.removeEventListener('mouseup', onMouseUp)
  document.addEventListener('mouseup', onMouseUp)

  var slot = getSlotElement(event.target)
  startId = slot.getAttribute('data-id')

  fillSelection = []

  currentKit = getKitElement(slot)
  currentKit.addEventListener('mouseover', onMouseEnter)

  var deck = getDeckElement(currentKit)
  deckId = deck.getAttribute('data-id')

  window.events.emit('selectSlot', deckId, startId)
}

function onMouseUp(event){

  event.stopPropagation()
  event.preventDefault()
  document.removeEventListener('mouseup', onMouseUp)

  if (currentKit){
    currentKit.removeEventListener('mouseover', onMouseEnter)

    var grid = window.context.instances[deckId].grid()
    var deck = window.context.instances[deckId].mainChunk
    var template = getDescriptor(deck, startId)

    fillSelection.forEach(function(id, i){
      var descriptor = fillFrom(template, id, i)
      deck.update(descriptor)
    })

    window.events.emit('kitChange', deckId)

    targetId = null
    refreshHighlight(grid)
  }

  startId = null
  currentKit = null
  fillSelection = null
}

function fillFrom(template, id, offset){
  var descriptor = {id: String(id), node: 'inherit', from: template.id}
  if (typeof template.offset === 'number'){
    descriptor.offset = template.offset + 1 + offset
  } else {
    descriptor.offset = offset + 1
  }
  return descriptor
}

function onMouseEnter(event){
  var grid = window.context.instances[deckId].grid()
  var slot = getSlotElement(event.target)
  if (slot){
    targetId = slot.getAttribute('data-id')
    refreshHighlight(grid)
  }
}

function refreshHighlight(grid){
  var ids = getRange(grid, startId, targetId||startId)

  for (var i=0;i<currentKit.children.length;i++){
    var slot = currentKit.children[i]
    var slotId = slot.getAttribute('data-id')
    if (slotId === targetId || ~ids.indexOf(slot.getAttribute('data-id'))){
      slot.classList.add('-filling')
    } else {
      slot.classList.remove('-filling')
    }
  }

  fillSelection = ids
}

function getRange(grid, startId, endId){
  var result = []

  var start = grid.coordsAt(parseInt(startId))
  var end = grid.coordsAt(parseInt(endId))

  var rowStart = Math.min(start[0], end[0])
  var rowEnd = Math.max(start[0], end[0])
  var colStart = Math.min(start[1], end[1])
  var colEnd = Math.max(start[1], end[1])

  for (var row=rowStart;row<=rowEnd;row++){

    var rr = row
    if (start[0] > end[0]){
      rr = rowStart - (row - rowEnd)
    }

    for (var col=colStart;col<=colEnd;col++){

      var cc = col
      if (start[1] > end[1]){
        cc = colStart - (col - colEnd)
      }

      var id = String(grid.index(rr, cc))
      if (id != startId){
        result.push(id)
      }
    }
  }

  return result
}

function getKitElement(node){
  while (node && !node.classList.contains('Kit')){
    node = node.parentNode
  }
  return node
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

function getDescriptor(chunk, id){
  var result = { id: id }
  chunk.slots().some(function(slot){
    if (slot.id === id){
      result = slot
      return true
    }
  })
  return result
}