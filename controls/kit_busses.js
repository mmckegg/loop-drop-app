var h = require('hyperscript')
var ever = require('ever')

var EventEmitter = require('events').EventEmitter

module.exports = function(noteStream){

  var elements = []
  var selectedElement = null

  var names = 'ABCDEFGH'.split('')

  for (var i=0;i<8;i++){
    var element = h('div', {'data-id': i, 'draggable': true}, names[i])
    element.activeCount = 0
    elements.push(element)
  }

  var kitBusses = h('div.KitBusses', elements)

  kitBusses.events = new EventEmitter()
  kitBusses.on = function(event, cb){
    return kitBusses.events.on(event, cb)
  }

  noteStream.on('data', function(event){
    var element = elements[event.data[1]]
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

  kitBusses.select = function(id){
    if (selectedElement){
      selectedElement.classList.remove('-selected')
    }
    selectedElement = elements[id]
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