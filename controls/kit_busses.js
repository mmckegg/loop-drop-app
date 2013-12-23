var h = require('hyperscript')
var ever = require('ever')

var EventEmitter = require('events').EventEmitter

module.exports = function(noteStream, changeStream){

  var elements = []
  var elementLookup = {}
  var noteLookup = {}

  var selectedElement = null

  var names = 'ABCDEFGH'.split('')

  for (var i=0;i<8;i++){
    var element = h('div', {'data-id': names[i], 'draggable': true}, names[i])
    element.activeCount = 0
    elementLookup[names[i]] = element
    addDragEvents(element)
    elements.push(element)
  }

  var kitBusses = h('div.KitBusses', elements)

  kitBusses.changeStream = changeStream
  kitBusses.events = new EventEmitter()
  kitBusses.on = function(event, cb){
    return kitBusses.events.on(event, cb)
  }

  changeStream.on('data', function(data){
    if (elementLookup[data.output]){
      elementLookup[data.output].sound = data
      noteLookup[data.id] = elementLookup[data.output]
    } else {
      noteLookup[data.id] = null
    }
  })

  noteStream.on('data', function(event){
    var element = noteLookup[event.data[1]]
    if (element){
      if (event.data[2]){
        element.activeCount += 1
      } else {
        element.activeCount -= 1
      }

      if (element.activeCount > 0){
        element.classList.add('-active')
      } else {
        element.classList.remove('-active')
      }
    }
  })

  kitBusses.triggerOn = function(id){
    var element = elementLookup[id]
    element.classList.add('-active')
  }

  kitBusses.select = function(id){
    if (selectedElement){
      selectedElement.classList.remove('-selected')
    }
    selectedElement = elementLookup[id]
    selectedElement.classList.add('-selected')
    kitBusses.events.emit('select', id)
  }

  kitBusses.deselect = function(){
    if (selectedElement){
      selectedElement.classList.remove('-selected')
      selectedElement = null
    }
  }

  ever(kitBusses).on('mousedown', function(e){
    if (e.srcElement.getAttribute('data-id') != null){
      kitBusses.select(e.srcElement.getAttribute('data-id'))
    }
  })

  return kitBusses
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
  if (window.currentDrag && (event.shiftKey || window.currentDrag.parentNode.classList.contains('Kit'))){
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

    if (event.shiftKey || (kit.classList.contains('Kit') && kit.changeStream === destinationKit.changeStream)){

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

  }
}

function onDragEnter(event){
  this.classList.add('-dragover')
}

function onDragLeave(event){
  this.classList.remove('-dragover')
}