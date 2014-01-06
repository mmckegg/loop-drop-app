var h = require('hyperscript')
var ever = require('ever')
var getNotesInside = require('midi-looper-launchpad/lib/get_notes_inside')

var EventEmitter = require('events').EventEmitter

module.exports = function(noteStream, changeStream){

  var elements = []
  var outputLookup = {}
  var selectedElement = null
  var elementLookup = {}

  var busNames = 'ABCDEFGH'.split('')

  for (var i=0;i<64;i++){
    var fillHandle = h('div', {className: '.fill', 'draggable': false})
    var element = h('div', {'data-id': i, 'draggable': true}, fillHandle)
    elementLookup[i] = element
    element.activeCount = 0
    addDragEvents(element)
    addFillEvents(fillHandle)
    elements.push(element)
  }

  for (var i=0;i<8;i++){
    var element = h('div.-bus', {'data-id': busNames[i], 'draggable': true}, h('span', busNames[i]))
    element.activeCount = 0
    elementLookup[busNames[i]] = element
    addDragEvents(element)
    elements.push(element)
  }

  var kit = h('div.Kit', elements)

  kit.changeStream = changeStream
  kit.events = new EventEmitter()
  kit.on = function(event, cb){
    return kit.events.on(event, cb)
  }

  noteStream.on('data', function(event){
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

  changeStream.on('data', function(sound){
    var element = elementLookup[sound.id]
    if (element){
      element.sound = sound

      if (sound.sources && sound.sources.length){
        element.classList.add('-present')
      } else {
        element.classList.remove('-present')
      } 

      if (sound.sources && sound.sources.$){
        element.classList.add('-linked')
      } else {
        element.classList.remove('-linked')
      }

      if (sound.downAction || sound.upAction){
        element.classList.add('-action')
      } else {
        element.classList.remove('-action')
      }
      
    }

    outputLookup[sound.id] = elementLookup[sound.output] || null
  })

  kit.select = function(id){
    if (selectedElement){
      selectedElement.classList.remove('-selected')
    }
    selectedElement = elementLookup[id]
    selectedElement.classList.add('-selected')
    kit.events.emit('select', id)
  }

  kit.deselect = function(){
    if (selectedElement){
      selectedElement.classList.remove('-selected')
      selectedElement = null
    }
  }

  ever(kit).on('mousedown', function(e){
    var slot = getSlotElement(e.target)
    if (slot && slot.getAttribute('data-id') != null){
      kit.select(slot.getAttribute('data-id'))
    }
  })

  return kit
}

function getSlotElement(node){
  while (node && !node.getAttribute('data-id')){
    node = node.parentNode
  }
  return node
}

function addFillEvents(element){
  element.addEventListener('mousedown', onMouseDown, true)
}

var startSlot = null
var targetSlot = null
var currentKit = null
var fillSelection = null

function onMouseDown(event){
  event.preventDefault()
  event.stopPropagation()

  document.addEventListener('mouseup', onMouseUp, true)

  startSlot = event.target.parentNode
  fillSelection = []
  currentKit = startSlot.parentNode
  currentKit.addEventListener('mouseover', onMouseEnter, true)
  currentKit.select(startSlot.getAttribute('data-id'))
}

function onMouseUp(event){

  event.stopPropagation()
  event.preventDefault()
  document.removeEventListener('mouseup', onMouseUp)

  if (currentKit){
    currentKit.removeEventListener('mouseover', onMouseEnter, true)

    var startId = startSlot.getAttribute('data-id')
    var template = startSlot.sound

    fillSelection.forEach(function(id, i){
      var newSound = fillFrom(template, id, i)
      currentKit.changeStream.write(newSound)
    })

    targetSlot = null
    refreshHighlight()
  }

  startSlot = null
  currentKit = null
  fillSelection = null
}

function fillFrom(template, id, offset){
  var newSound = JSON.parse(JSON.stringify(template))
  newSound.id = String(id)
  newSound.sources = {$: 'get(' + template.id + ').sources'}
  if (template.gain) newSound.gain = {$: 'get(' + template.id + ').gain'}
  if (template.output) newSound.output = {$: 'get(' + template.id + ').output'}
  if (typeof template.offset === 'number'){
    newSound.offset = template.offset + 1 + offset
  } else {
    newSound.offset = offset + 1
  }
  return newSound
}

function onMouseEnter(event){
  if (event.target.getAttribute('data-id')){
    targetSlot = event.target
    refreshHighlight()
  }
}

function refreshHighlight(){
  var startId = startSlot.getAttribute('data-id')
  var endId = targetSlot && targetSlot.getAttribute('data-id')
  var ids = getNotesInside('144/' + startId, '144/' + (endId||startId)).map(getSecondAsString)
  ids.push(endId)

  for (var i=0;i<currentKit.children.length;i++){
    var slot = currentKit.children[i]
    if (slot === targetSlot || ~ids.indexOf(slot.getAttribute('data-id'))){
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

function addDragEvents(element){
  element.addEventListener('dragover', onDragOver, true)
  element.addEventListener('drop', onDrop, true)
  element.addEventListener('dragenter', onDragEnter, true)
  element.addEventListener('dragleave', onDragLeave, true)
  element.addEventListener('dragstart', onDragStart, true)
  element.addEventListener('dragend', onDragEnd, true)
}

function onDragStart(event){
  window.currentDrag = event.target
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

  var destinationKit = event.target.parentNode
  var destinationId = event.target.getAttribute('data-id')

  if (window.currentDrag){

    var sound = window.currentDrag.sound
    var kit = window.currentDrag.parentNode

    if (event.shiftKey){

      sound.output = destinationId
      kit.changeStream.write(sound)

    } else if (!(kit == destinationKit && sound.id == destinationId)){

      var newSound = JSON.parse(JSON.stringify(sound))
      newSound.id = destinationId

      destinationKit.changeStream.write(newSound)

      kit.deselect()
      destinationKit.select(destinationId)

      if (!event.altKey){
        kit.changeStream.write({id: sound.id})
      }
    }

  } else if (event.dataTransfer.files.length == 1) {
    destinationKit.parentNode.events.emit('fileDrop', event.dataTransfer.files[0], destinationId)
  }
}

function onDragEnter(event){
  this.classList.add('-dragover')
}

function onDragLeave(event){
  this.classList.remove('-dragover')
}