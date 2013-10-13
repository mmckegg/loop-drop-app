var h = require('hyperscript')
var ever = require('ever')

var Kit = require('./kit')
var KitBus = require('./kit_busses')
var Loader = require('./loader')

module.exports = function(streams){
  var kitA = Kit(streams.notesA, streams.soundsA)
  var kitB = Kit(streams.notesB, streams.soundsB)

  var kitBusA = KitBus(streams.notesA)
  var kitBusB = KitBus(streams.notesB)

  var loaderA = Loader(streams.soundsA)
  var loaderB = Loader(streams.soundsB)

  var slotA = h('div', kitA, kitBusA, loaderA)
  var slotB = h('div', kitB, kitBusB, loaderB)

  kitA.on('select', function(){
    slotB.classList.remove('-selected')
    slotA.classList.add('-selected')
    kitB.deselect()
    kitBusB.deselect()
    kitBusA.deselect()
  })

  kitB.on('select', function(){
    slotA.classList.remove('-selected')
    slotB.classList.add('-selected')
    kitA.deselect()
    kitBusB.deselect()
    kitBusA.deselect()
  })

  kitBusB.on('select', function(){
    slotA.classList.remove('-selected')
    slotB.classList.add('-selected')
    kitA.deselect()
    kitB.deselect()
    kitBusA.deselect()
  })

  kitBusA.on('select', function(){
    slotB.classList.remove('-selected')
    slotA.classList.add('-selected')
    kitA.deselect()
    kitB.deselect()
    kitBusB.deselect()
  })

  loaderA.on('record', function(state){
    streams.commands.write({command: 'toggleRecord', deck: 'a'})
  })

  loaderB.on('record', function(state){
    streams.commands.write({command: 'toggleRecord', deck: 'b'})
  })

  var holder = h('div.Holder', slotA, slotB)

  holder.kitA = kitA
  holder.kitB = kitB

  return holder
}