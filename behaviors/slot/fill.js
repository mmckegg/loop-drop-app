var getNotesInside = require('midi-looper-launchpad/lib/get_notes_inside')

module.exports = function(element){
  element.addEventListener('mousedown', onMouseDown, true)
}

var startId = null
var targetId = null
var currentKit = null
var fillSelection = null
var deckId = null

function onMouseDown(event){
  event.preventDefault()
  event.stopPropagation()

  document.addEventListener('mouseup', onMouseUp, true)

  var slot = getSlotElement(event.target)
  startId = slot.getAttribute('data-id')

  fillSelection = []

  currentKit = getKitElement(slot)
  currentKit.addEventListener('mouseover', onMouseEnter, true)

  var deck = getDeckElement(currentKit)
  deckId = deck.getAttribute('data-id')

  window.events.emit('selectSlot', deckId, startId)
}

function onMouseUp(event){

  event.stopPropagation()
  event.preventDefault()
  document.removeEventListener('mouseup', onMouseUp)

  if (currentKit){
    currentKit.removeEventListener('mouseover', onMouseEnter, true)

    var template = window.context.decks[deckId].slots[startId]
    var changeStream = window.context.decks[deckId].changeStream

    fillSelection.forEach(function(id, i){
      var descriptor = fillFrom(template, id, i)
      changeStream.write(descriptor)
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
  var descriptor = JSON.parse(JSON.stringify(template))
  descriptor.id = String(id)
  if (template.sources) descriptor.sources = {$: 'get(' + template.id + ').sources'}
  if (template.processors) descriptor.processors = {$: 'get(' + template.id + ').processors'}
  if (template.gain) descriptor.gain = {$: 'get(' + template.id + ').gain'}
  if (template.output) descriptor.output = {$: 'get(' + template.id + ').output'}
  if (template.params) descriptor.params = {$: 'get(' + template.id + ').params'}

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