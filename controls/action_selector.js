var h = require('hyperscript')
var extend = require('xtend')
var EventEmitter = require('events').EventEmitter

module.exports = function(options){

  var element = h('select', options, 
    h('option', {value: ''}, 'Choose action...'),
    h('optgroup', {label: 'Transpose Distribute'}, 
      h('option', {value: 'transdist-up-7'}, 'Up 7'),
      h('option', {value: 'transdist-down-8'}, 'Down 8')
    ),
    h('optgroup', {label: 'Slice'}, 
      h('option', {value: 'slice-8'}, 'Into 8'),
      h('option', {value: 'slice-16'}, 'Into 16')
    )
  )

  element.events = new EventEmitter()

  element.onchange = function(){
    if (this.value){
      element.events.emit('action', this.value)
      this.value = ""
    }
    this.blur()
  }

  element.on = function(event, cb){
    return element.events.on(event, cb)
  }

  return element

}