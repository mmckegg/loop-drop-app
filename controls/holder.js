var h = require('hyperscript')
var ever = require('ever')

var Kit = require('./kit')
var KitBus = require('./kit_busses')
var Loader = require('./loader')
var Editor = require('../controls/editor')

module.exports = function(streams){
  var kitA = Kit(streams.notesA, streams.soundsA)
  var kitB = Kit(streams.notesB, streams.soundsB)

  var soundsA = {}
  var soundsB = {}

  streams.soundsA.on('data', function(data){
    soundsA[data.id] = data
  })

  streams.soundsB.on('data', function(data){
    soundsB[data.id] = data
  })

  var loaderA = Loader(streams.soundsA)
  var loaderB = Loader(streams.soundsB)

  var deckA = h('div.Deck', loaderA, kitA)
  var deckB = h('div.Deck', loaderB, kitB)


  deckA.classList.add('-left')
  deckB.classList.add('-right')

  var editor = Editor()

  kitA.on('select', function(id){
    var sound = soundsA[id] || {id: id}
    editor.edit(sound, streams.soundsA)
    editor.classList.add('-left')
    editor.classList.remove('-right')

    deckB.classList.remove('-selected')
    deckA.classList.add('-selected')
    kitB.deselect()
  })

  kitB.on('select', function(id){
    var sound = soundsB[id] || {id: id}
    editor.edit(sound, streams.soundsB)
    editor.classList.add('-right')
    editor.classList.remove('-left')

    deckA.classList.remove('-selected')
    deckB.classList.add('-selected')
    kitA.deselect()
  })

  loaderA.on('record', function(state){
    streams.commands.write({command: 'toggleRecord', deck: 'a'})
  })

  loaderB.on('record', function(state){
    streams.commands.write({command: 'toggleRecord', deck: 'b'})
  })

  var holder = h('div.Holder', deckA, editor, deckB)

  holder.kitA = kitA
  holder.kitB = kitB

  return holder
}