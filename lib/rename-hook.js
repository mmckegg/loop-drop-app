var QueryParam = require('loop-drop-setup/query-param')

module.exports = RenameHook

var lookup = new WeakMap()
var renaming = null
var currentCallback = null

function RenameHook(obs, enabled, onChange){
  if (!(this instanceof RenameHook)) return new RenameHook(obs, enabled, onChange) 

  if (typeof enabled === 'function'){
    onChange = enabled
    enabled = true
  } else if (enabled == null){
    enabled = true
  }

  this.enabled = enabled
  this.onChange = onChange
  this.object = obs
  lookup.set(obs, this)
}

RenameHook.prototype.hook = function(node, prop, current){
  if (current){
    this.listener = current.listener
    this.listener.hook = this
  } else {

    this.listener = {
      handleEvent: handleEvent,
      hook: this
    }

    node.textContent = QueryParam(this.object, 'id').read()
    node.addEventListener('click', this.listener)
    node.addEventListener('dblclick', this.listener)
    node.addEventListener('blur', this.listener)
    node.addEventListener('keydown', this.listener)
  }

  this.node = node
}

RenameHook.prototype.unhook = function(node, prop, next){
  if (!next){
    node.removeEventListener('click', this.listener)
    node.removeEventListener('dblclick', this.listener)
    node.removeEventListener('blur', this.listener)
    node.removeEventListener('keydown', this.listener)
  }
}

RenameHook.prototype.rename = function(cb){
  if (renaming !== this.object && this.enabled){
    this.node.contentEditable = true
    renaming = this.object
    currentCallback = cb

    var id = QueryParam(this.object, 'id')
    this.node.textContent = id.read()
    selectInside(this.node)
  }
}

RenameHook.prototype.save = function(){
  if (renaming === this.object){

    var id = QueryParam(this.object, 'id')
    this.lastValue = id.read()
    this.value = this.node.textContent.trim()

    id.set(this.value)

    this.node.contentEditable = false
    clearSelection()

    if (this.onChange){
      this.onChange(this.lastValue, this.value, this.object)
    }

    renaming = null
  }
}

RenameHook.prototype.cancel = function(){
  if (renaming === this.object){
    this.node.textContent = QueryParam(this.object, 'id').read()
    this.node.contentEditable = false
    clearSelection()
    renaming = null
  }
}

RenameHook.rename = function(obs, cb){
  setTimeout(function(){
    var hook = lookup.get(obs)
    if (hook){
      hook.rename(cb)
    }
  }, 50)
}

RenameHook.save = function(obs){
  var hook = RenameHook.get(obs)
  if (hook){
    hook.save()
  }
}

RenameHook.cancel = function(obs){
  var hook = RenameHook.get(obs)
  if (hook){
    hook.save()
  }
}

RenameHook.get = function(obs){
  if (obs){
    return lookup.get(obs)
  } else if (renaming){
    return lookup.get(renaming)
  }
}

function handleEvent(e){
  var hook = this.hook
  if (hook){
    if (e.type === 'click'){
      hook.rename()
    } else if (e.type === 'dblclick'){
      e.stopPropagation()
    } else if (e.type === 'keydown'){
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