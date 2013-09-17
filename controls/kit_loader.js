var h = require('hyperscript')
var EventEmitter = require('events').EventEmitter

var persistence = require('../lib/persistence')

var kitNames = ['Kit 1', 'Kit 2', 'Kit 3', 'Kit 4', 'Kit 5', 'Kit 6', 'Kit 7', 'Kit 8']

module.exports = function(kitHolder){

  var kitRecordButtons = [
    h('input.RecordButton', {type: 'checkbox'}),
    h('input.RecordButton', {type: 'checkbox'}),
    h('input.RecordButton', {type: 'checkbox'}),
    h('input.RecordButton', {type: 'checkbox'})
  ]

  function option(name){
    return h('option', {value: name}, name)
  }

  var kitSelectors = [
    h('select.KitSelector', kitNames.map(option)),
    h('select.KitSelector', kitNames.map(option)),
    h('select.KitSelector', kitNames.map(option)),
    h('select.KitSelector', kitNames.map(option))
  ]

  var saveButtons = [
    h('input.SaveButton', {type: 'button'}),
    h('input.SaveButton', {type: 'button'}),
    h('input.SaveButton', {type: 'button'}),
    h('input.SaveButton', {type: 'button'})
  ]

  var kitLoaders = [
    h('div', kitSelectors[0], saveButtons[0], kitRecordButtons[0]),
    h('div', kitSelectors[1], saveButtons[1], kitRecordButtons[1]),
    h('div', kitSelectors[2], saveButtons[2], kitRecordButtons[2]),
    h('div', kitSelectors[3], saveButtons[3], kitRecordButtons[3])
  ]

  kitHolder.on('selectKit', function(kit, id){
    kitLoaders.forEach(function(loader, i){
      if (id == i){
        loader.classList.add('-selected')
      } else {
        loader.classList.remove('-selected')
      }
    })
  })

  var kitLoader = h('div.KitLoader', kitLoaders)
  kitLoader.events = new EventEmitter()

  kitLoader.on = function(event, cb){
    return kitLoader.events.on(event, cb)
  }

  kitRecordButtons.forEach(function(button, id){
    button.onclick = function(){
      if (this.checked){
        kitLoader.events.emit('record', id)
      } else {
        kitLoader.events.emit('stopRecord', id)
      }
    }
  })

  saveButtons.forEach(function(button, id){
    var kit = kitHolder.kits[id]
    kitSelectors[id].onchange = function(){
      persistence.load(kit, this.value)
    }
    button.onclick = function(){
      persistence.store(kit, kitSelectors[id].value)
    }
  })

  return kitLoader

}