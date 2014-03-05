var getNotesInside = require('midi-looper-launchpad/lib/get_notes_inside')

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

    var deck = window.context.instances[deckId]
    var template = deck.getDescriptor(startId)

    fillSelection.forEach(function(id, i){
      var descriptor = fillFrom(template, id, i)
      deck.update(descriptor)
    })

    window.events.emit('kitChange', deckId)

    targetId = null
    refreshHighlight()
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
  var slot = getSlotElement(event.target)
  if (slot){
    targetId = slot.getAttribute('data-id')
    refreshHighlight()
  }
}

function refreshHighlight(){
  var ids = getNotesInside('144/' + startId, '144/' + (targetId||startId)).map(getSecondAsString)
  ids.push(targetId)

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

function getSecondAsString(ary){
  return String(ary[1])
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