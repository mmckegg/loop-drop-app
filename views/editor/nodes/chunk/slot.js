var Editor = require('soundbank-slot-editor')
var read = require('../../params/read.js')
var deepEqual = require('deep-equal')

module.exports = SlotEditor

// hacky fallback to old slot editor. Need to rewrite in mercury!

function SlotEditor(param){
  if (!(this instanceof SlotEditor)) return new SlotEditor(param)
  this.param = param
}

SlotEditor.prototype.type = 'Widget'

SlotEditor.prototype.init = function(){
  var element = document.createElement('div')
  var state = this.state = {
    param: this.param,
    editor: Editor(window.context.audio, element),
    lastValue: null
  }

  this.state.editor.on('change', function(value){
    if (state.param && value){
      state.lastValue = value
      state.param.set(value)
    }
  })

  var value = read(state.param)
  state.editor.set(value || {})
  state.lastValue = value

  return element
}

SlotEditor.prototype.update = function(prev, elem){
  var state = this.state = prev.state
  state.param = this.param
  var value = read(state.param) || {}
  if (!deepEqual(value, state.lastValue)){
    state.editor.set(value)
    state.lastValue = value
  }
}

//SlotEditor.prototype.destroy = function(elem){}