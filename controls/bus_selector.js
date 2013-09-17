var h = require('hyperscript')
var extend = require('xtend')
var EventEmitter = require('events').EventEmitter

module.exports = function(options){

  var target = null

  var busOptions = h('optgroup', {label: 'Busses'})

  var element = h('select', options,
    h('option', {value: ''}, 'Output: Master'),
    busOptions
  )

  element.setTarget = function(sound){
    target = null
    element.disabled = true
    if (sound){
      var busses = sound.soundbank.getBusses()
      replaceChildren(busOptions, busses.map(function(bus){
        return h('option', {value: bus.id}, bus.id)
      })) 
      element.disabled = false
      element.value = sound.busId || ''
      target = sound
    }
  }

  element.events = new EventEmitter()

  element.onchange = function(){
    if (target){
      if (this.value){
        target.busId = this.value
      } else {
        target.busId = null
      }
    }
  }

  return element

}

function replaceChildren(node, children){
  while(node.lastChild){
    node.removeChild(node.lastChild);
  }
  children.forEach(function(child){
    node.appendChild(child)
  })
}