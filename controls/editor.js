var h = require('hyperscript')

var editors = {
  'sample': require('./sample_editor')
}

module.exports = function(){


  var editor = h('div.Editor')
  var activeEditor = null

  editor.edit = function(sound, changeStream){
    if (editors[sound.source.type]){
      if (activeEditor && activeEditor.parentNode) editor.removeChild(activeEditor)
      activeEditor = editors[sound.source.type](sound, changeStream)
      editor.appendChild(activeEditor)
    }
  }

  return editor
}