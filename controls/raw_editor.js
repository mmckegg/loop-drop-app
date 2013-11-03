var behave = require('../lib/textarea-behavior')
var h = require('hyperscript')
var safeEval = require('notevil')

module.exports = function(sound, changeStream){
  var textEditor = h('textarea')

  behave(textEditor)

  var animating = false
  function update(){
    if (!animating){
      animating = true
      window.requestAnimationFrame(function(cb){
        textEditor.value = JSON.stringify(sound, null, 4).slice(2, -2)
          .replace(/^    /gm, '')
          .replace(/\[\s*([0-9\.\-]+),\s*([0-9\.\-]+)\s*\]/g, "[ $1, $2 ]")
          .replace(/^(\s+\{)\n\s+/gm, '$1   ')
        lastValue = textEditor.value
        animating = false
      })
    }
  }

  var lastValue = null
  function save(){
    if (textEditor.value != lastValue){
      lastValue = textEditor.value
      try {
        var object = safeEval('sound = {' + textEditor.value + '}')
        object.id = sound.id
        changeStream.write(object)
      } catch (ex) {}
    }
  }

  function handleData(data){
    if (data.id == sound.id){
      sound = data
      if (document.activeElement != textEditor){
        update()
      }
    }
  }

  changeStream.on('data', handleData)

  textEditor.oninput = save
  textEditor.onkeyup = save

  textEditor.onblur = function(){
    update()
  }

  update()

  var result = h('div.RawEditor', textEditor)
  result.destroy = function(){
    changeStream.removeListener('data', handleData)
  }
  return result
}