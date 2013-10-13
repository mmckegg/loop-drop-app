var h = require('hyperscript')
var ever = require('ever')
var EventEmitter = require('events').EventEmitter

module.exports = function(changeStream){

  var nameInput = h('input', {value: 'New Kit'})
  var saveButton = h('button', 'save')
  var recordButton = h('button', 'rec')

  var currentKit = h('div', {className: '.current'}, recordButton, nameInput, saveButton)
  var kits = h('div', {className: '.kits'})

  var lastName = null

  var currentSounds = {}
  changeStream.on('data', function(data){
    currentSounds[data.id] = data
  })

  ever(saveButton).on('click', function(){
    save(nameInput.value)
  })

  ever(recordButton).on('click', function(){
    loader.events.emit('record')
  })

  ever(kits).on('click', function(e){
    var value = e.target.getAttribute('data-name')
    if (value){
      load(value)
    }
  })

  function addKit(name){
    var element = h('div', {'data-name': name}, name)
    kits.appendChild(element)
  }

  Object.keys(window.localStorage).forEach(function(key){
    var match = /^kit\/(.+)/.exec(key)
    if (match){
      addKit(match[1])
    }
  })

  function refreshCurrent(){
    nameInput.value = lastName
  }

  function save(name){
    var kitStorage = {sounds: [], busses: []}
    for (var i=0;i<64;i++){
      var sound = currentSounds[i] || {id: i}
      kitStorage.sounds.push(sound)
    }
    window.localStorage['kit/' + name] = JSON.stringify(kitStorage)
    lastName = name
    refreshCurrent()
  }

  function load(name){
    if (window.localStorage['kit/' + name]){
      var kitStorage = JSON.parse(window.localStorage['kit/' + name])
      kitStorage.sounds.forEach(function(sound, i){
        changeStream.write(sound)
        currentSounds[sound.id] = sound
      })
    }
    lastName = name
    refreshCurrent()
  }

  var loader = h('div.Loader', currentKit, kits)

  loader.events = new EventEmitter()
  loader.on = function(event, cb){
    return loader.events.on(event, cb)
  }

  return loader
}