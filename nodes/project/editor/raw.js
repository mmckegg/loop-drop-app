
var JSMN = require('lib/jsmn.js')
var deepEqual = require('deep-equal')
var watch = require('observ/watch')

var ace = require('brace')
require('brace/mode/javascript')
require('brace/theme/ambiance')

var NO_TRANSACTION = {}

module.exports = RawEditor

function RawEditor(fileObject){
  if (!(this instanceof RawEditor)){
    return new RawEditor(fileObject)
  }
  this.fileObject = fileObject
  this.file = fileObject && fileObject.file
}

RawEditor.prototype.type = 'Widget'

RawEditor.prototype.init = function(){
  var element = document.createElement('div')
  element.className = 'RawEditor'

  var el = document.createElement('div')

  var textEditor = this.editor = ace.edit(el)

  window.editors = window.editors || []
  window.editors.push(textEditor)

  textEditor.setTheme('ace/theme/ambiance');
  textEditor.session.setMode('ace/mode/javascript')
  textEditor.session.setUseWorker(false)
  textEditor.session.setTabSize(2)
  textEditor.renderer.setScrollMargin(20,100)
  textEditor.renderer.setPadding(20)
  textEditor.renderer.setShowGutter(false)

  var currentFile = null
  var self = this

  var currentTransaction = NO_TRANSACTION
  var currentSaveTransaction = NO_TRANSACTION

  textEditor.setFile = function(fileObject){
    clearTimeout(saveTimer)

    if (self.release){
      self.release()
      self.release = null
    }

    currentFile = fileObject

    if (fileObject){
      self.release = watch(fileObject, update)
    }
  }

  function save(){
    var value = textEditor.session.getValue()
    if (currentFile){
      try {
        var object = JSMN.parse(value)
        currentSaveTransaction = object
        currentFile.set(object)
        currentSaveTransaction = NO_TRANSACTION
      } catch (ex) {}
    }
  }

  function update(){
    var data = currentFile ? currentFile() : null
    if (data && currentSaveTransaction !== data._diff && !deepEqual(currentSaveTransaction,data)){
      var newValue = JSMN.stringify(data || {})
      currentTransaction = newValue
      textEditor.session.setValue(newValue, -1)
      currentTransaction = NO_TRANSACTION
    }
  }

  var blurTimer = null
  textEditor.on('focus', function(){
    clearTimeout(blurTimer)
  })

  textEditor.on('blur', function(){
    clearTimeout(blurTimer)
    blurTimer = setTimeout(function(){
      if (!textEditor.isFocused()){
        update()
      }
    }, 100)
  })

  var saveTimer = null
  textEditor.on('change', function(){
    if (currentTransaction === NO_TRANSACTION){
      clearTimeout(saveTimer)
      saveTimer = setTimeout(save, 100)
    }
  })

  textEditor.setFile(this.fileObject)

  element.appendChild(el)
  return element
}

RawEditor.prototype.update = function(prev, elem){
  this.editor = prev.editor
  this.release = prev.release

  if (prev.file !== this.file){
    this.editor.setFile(this.fileObject)
  }
  return elem
}

RawEditor.prototype.destroy = function(elem){
  this.editor.destroy()
  this.release && this.release()
  this.release = null
}