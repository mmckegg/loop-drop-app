var h = require('hyperscript')
var ever = require('ever')

var Kit = require('./kit')
var Loader = require('./loader')

module.exports = function(streams){
  var kitA = Kit(streams.noteStreamA)
  var kitB = Kit(streams.noteStreamB)

  var loaderA = Loader(streams.soundStreamA)
  var loaderB = Loader(streams.soundStreamB)

  var holder = h('div.Holder', h('div', kitA, loaderA), h('div', kitB, loaderB))

  holder.kitA = kitA
  holder.kitB = kitB

  return holder
}