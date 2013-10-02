var h = require('hyperscript')
var ever = require('ever')

var WaveView = require('wave-view')

module.exports = function(streams){

  var waveView = WaveView()

  var editor = h('div.Editor', waveView)

  editor.edit = function(sound){
    waveView.setValue(sound)
  }

  return editor
}