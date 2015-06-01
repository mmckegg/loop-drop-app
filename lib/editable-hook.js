var read = require('lib/read')

module.exports = EditableHook

function EditableHook(param, selected, onChange) {
  if (!(this instanceof EditableHook)) return new EditableHook(param, selected, onChange) 

  if (typeof selected === 'function'){
    onChange = selected
    selected = null
  }

  this.selected = selected
  this.onChange = onChange
  this.param = param
}

EditableHook.prototype.hook = function(node, prop, current){
  if (current){
    this.listener = current.listener
    this.listener.hook = this
  } else {

    this.listener = {
      handleEvent: handleEvent,
      hook: this
    }
    node.contentEditable = true
    node.textContent = read(this.param)
    node.addEventListener('blur', this.listener)
    node.addEventListener('keydown', this.listener)
  }

  if (this.selected && document.activeElement !== node) {
    setTimeout(function() {
      node.focus()
      selectInside(node)
    }, 10)
  }

  this.node = node
}

EditableHook.prototype.unhook = function(node, prop, next){
  if (!next){
    node.contentEditable = false
    node.removeEventListener('blur', this.listener)
    node.removeEventListener('keydown', this.listener)
  }
}

EditableHook.prototype.save = function(){

  var value = read(this.param)
  this.lastValue = value
  this.value = this.node.textContent.trim()

  this.param.set(this.value)

  clearSelection()

  if (this.onChange){
    this.onChange(this.lastValue, this.value, this.param)
  }

}

EditableHook.prototype.cancel = function(){
  this.node.textContent = read(this.param)
  clearSelection()
}

function handleEvent(e){
  var hook = this.hook
  if (hook){
    if (e.type === 'keydown'){
      if (e.keyCode === 13){ // enter
        hook.save()
        e.preventDefault()
      } else if (e.keyCode === 27){ // esc
        hook.cancel()
      }
    } else if (e.type === 'blur'){
      hook.save()
    }
  }
}

function selectInside(element){
  var range = document.createRange();
  range.selectNodeContents(element);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range)
}

function clearSelection(){
  var sel = window.getSelection();
  sel.removeAllRanges();
}