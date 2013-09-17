var h = require('hyperscript')
var ever = require('ever')
var extend = require('xtend')

var Soundbank = require('soundbank')
var EventEmitter = require('events').EventEmitter


module.exports = function(audioContext){

  var kits = [
    getKit(audioContext),
    getKit(audioContext),
    getKit(audioContext),
    getKit(audioContext)
  ]


  var element = h('div', {className: 'KitHolder'}, kits)
  element.events = new EventEmitter()

  var selectedElement = null

  element.kits = kits
  element.soundbanks = kits.map(function(kit){return kit.soundbank})

  element.getSelected = function(){
    return selectedElement
  }

  kits.forEach(function(kit, i){
    kit.onselect = function(noteId){
      kits.forEach(function(k, si){
        if (i !== si){
          k.deselect()
        }
      })
      if (selectedElement != kit){
        element.events.emit('selectKit', kit, i)
      }
      selectedElement = kit
      element.events.emit('selectSound', kit.soundbank.getSound(noteId))
    }
  })

  element.select = function(channel, note){
    if (channel == 0){
      if (note < 64){
        kits[0].select(note)
      } else {
        kits[1].select(note-64)
      }
    } else if (channel == 1){
      if (note < 64){
        kits[2].select(note)
      } else {
        kits[3].select(note-64)
      }
    }
  }

  element.trigger = function(event){
    var at = event.time
    var channel = event.data[0] - 144
    var note = event.data[1]
    var velocity = event.data[2]

    if (channel == 0){
      if (note < 64){
        kits[0].trigger(at, note, velocity)
      } else {
        kits[1].trigger(at, note-64, velocity)
      }
    } else if (channel == 1){
      if (note < 64){
        kits[2].trigger(at, note, velocity)
      } else {
        kits[3].trigger(at, note-64, velocity)
      }
    }
  }

  element.on = function(event, cb){
    return element.events.on(event, cb)
  }

  return element
}

function getKit(audioContext){

  var elements = []
  for (var i=0;i<64;i++){
    var element = h('div', {'data-id': i, 'draggable': true})
    element.addEventListener('dragover', onDragOver, true)
    element.addEventListener('drop', onDrop, true)
    element.addEventListener('dragenter', onDragEnter, true)
    element.addEventListener('dragleave', onDragLeave, true)
    element.addEventListener('dragstart', onDragStart, true)
    element.addEventListener('dragend', onDragEnd, true)

    elements.push(element)
  }

  var element =  h('div', {className: 'Kit'}, elements)
  element.events = ever(element)
  element.soundbank = Soundbank(audioContext)

  element.soundbank.on('change', function(id){
    if (elements[id]){
      var sound = element.soundbank.getSound(id)
      if (sound){
        elements[id].classList.add('-present')
      } else {
        elements[id].classList.remove('-present')
      }
    }
  })

  var selectedElement = null

  element.trigger = function(at, note, velocity){
    if (elements[note]){
      if (velocity){
        console.log('ON:', note)
        elements[note].classList.add('-active')
        element.soundbank.trigger(at, note)
      } else {
        console.log('OFF:', note)
        elements[note].classList.remove('-active')
        element.soundbank.triggerOff(at, note)
      }
    }
  }

  element.markRecording = function(note){
    if (elements[note]){
      elements[note].classList.add('-recording')
    }
  }

  element.unmarkRecording = function(note){
    if (elements[note]){
      elements[note].classList.remove('-recording')
    }
  }

  element.deselect = function(){
    if (selectedElement){
      selectedElement.classList.remove('-selected')
      selectedElement = null
    }
    element.classList.remove('-selected')
  }

  element.onselect = function(){}

  element.select = function(id){
    if (selectedElement){
      selectedElement.classList.remove('-selected')
    }
    selectedElement = elements[id]
    selectedElement.classList.add('-selected')
    element.classList.add('-selected')
    element.onselect(id)
  }

  element.getSelected = function(){
    return selectedElement.getAttribute('data-id')
  }

  element.clear = function(){
    element.soundbank.clear()
    elements.forEach(function(e){
      e.classList.remove('-present')
    })
  }

  element.events.on('mousedown', function(e){
    if (e.srcElement.getAttribute('data-id') != null){
      element.select(e.srcElement.getAttribute('data-id'))
    }
  })

  return element
}

var currentDrag = null

function onDragStart(event){
  var soundId = event.target.getAttribute('data-id')
  var kit = event.target.parentNode
  var sound = kit.soundbank.getSound(soundId)
  currentDrag = [kit, sound]
}

function onDragEnd(event){
  var kit = event.target.parentNode
  var soundId = event.target.getAttribute('data-id')

  currentDrag = null
}

function onDragOver(event){
  event.preventDefault()
  if (event.altKey){
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

  if (currentDrag){
    var kit = currentDrag[0]
    var sound = currentDrag[1]

    if (!(kit == destinationKit && sound.id == destinationId)){

      destinationKit.soundbank.addSound(destinationId, sound)

      if (kit.getSelected() == sound.id){
        kit.deselect()
        destinationKit.select(destinationId)
      }

      if (!event.altKey){
        kit.soundbank.removeSound(sound.id)
      }
    }

  } else if (event.dataTransfer.files.length == 1) {
    destinationKit.parentNode.events.emit('fileDrop', event.dataTransfer.files[0], destinationKit, destinationId)
  }
}

function onDragEnter(event){
  this.classList.add('-dragover')
}

function onDragLeave(event){
  this.classList.remove('-dragover')
}