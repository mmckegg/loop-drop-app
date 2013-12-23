var h = require('hyperscript')
var ever = require('ever')

var EventEmitter = require('events').EventEmitter

module.exports = function(noteStream, changeStream){

  var elements = []
  var outputLookup = {}
  var selectedElement = null

  for (var i=0;i<64;i++){
    var element = h('div', {'data-id': i, 'draggable': true})
    element.activeCount = 0
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
    var element = elements[event.data[1]]
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
    var element = elements[sound.id]
    if (element){
      element.sound = sound
      if (sound.sources && sound.sources.length){
        element.classList.add('-present')
      } else {
        element.classList.remove('-present')
      }
    }

    outputLookup[sound.id] = elements[sound.output] || null
  })

  kit.select = function(id){
    if (selectedElement){
      selectedElement.classList.remove('-selected')
    }
    selectedElement = elements[id]
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
    if (e.srcElement.getAttribute('data-id') != null){
      kit.select(e.srcElement.getAttribute('data-id'))
    }
  })

  return kit
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