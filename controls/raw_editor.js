var behave = require('../lib/textarea-behavior')
var h = require('hyperscript')
var JSMN = require('../lib/jsmn')
var ace = require('brace')
require('brace/mode/javascript');
require('brace/theme/ambiance');

//require('code-mirror/theme/default')

module.exports = function(sound, changeStream){

  var element = h('div')
  var textEditor = ace.edit(element)
  textEditor.getSession().setMode('ace/mode/javascript');
  textEditor.setTheme('ace/theme/ambiance');
  textEditor.session.setUseWorker(false)
  textEditor.renderer.setShowGutter(false)
  //textEditor.setSize('100%', '100%')

  var animating = false
  function update(){
    if (!animating){
      animating = true
      window.requestAnimationFrame(function(cb){
        textEditor.setValue(JSMN.stringify(sound),-1)
        lastValue = textEditor.getValue()
        animating = false
      })
    }
  }

  var lastValue = null
  function save(){
    var value = textEditor.getValue()
    if (value != lastValue){
      lastValue = value
      try {
        var object = JSMN.parse(value)
        object.id = sound.id
        changeStream.write(object)
      } catch (ex) {}
    }
  }

  function handleData(data){
    if (data.id == sound.id){
      sound = data
      //if (!textEditor.hasFocus()){
        update()
      //}
    }
  }

  changeStream.on('data', handleData)

  textEditor.oninput = save
  textEditor.onkeyup = save

  textEditor.on('blur', update)

  update()

  var result = h('div.RawEditor', element)
  result.destroy = function(){
    changeStream.removeListener('data', handleData)
  }
  return result
}