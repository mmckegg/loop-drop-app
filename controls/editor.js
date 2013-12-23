var h = require('hyperscript')

var editors = {
  'sample': require('./sample_editor'),
  'raw': require('./raw_editor')
}

module.exports = function(){


  var editor = h('div.Editor')
  var activeEditor = null
  var activeRawEditor = null


  editor.edit = function(sound, changeStream){
    if (activeEditor && activeEditor.parentNode) {
      activeEditor.destroy()
      editor.removeChild(activeEditor)
    }

    if (activeRawEditor && activeRawEditor.parentNode) {
      activeRawEditor.destroy()
      editor.removeChild(activeRawEditor)
    }

    if (sound.sources && sound.sources.length === 1 && editors[sound.sources[0].type]){
      activeEditor = editors[sound.sources[0].type](sound, changeStream)
      editor.appendChild(activeEditor)
    }

    activeRawEditor = editors['raw'](sound, changeStream)
    editor.appendChild(activeRawEditor)
  }

  return editor
}