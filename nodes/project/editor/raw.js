
var JSMN = require('lib/jsmn.js')
var deepEqual = require('deep-equal')
var watch = require('observ/watch')

var ace = require('brace')
require('brace/mode/javascript')
require('brace/theme/ambiance')

var NO_TRANSACTION = {}

module.exports = RawEditor

function RawEditor (fileObject) {
  var element = document.createElement('div')
  element.className = 'RawEditor'

  var el = document.createElement('div')

  var textEditor = ace.edit(el)
  var release = null

  window.editors = window.editors || []
  window.editors.push(textEditor)

  textEditor.setTheme('ace/theme/ambiance')
  textEditor.session.setMode('ace/mode/javascript')
  textEditor.session.setUseWorker(false)
  textEditor.session.setTabSize(2)
  textEditor.renderer.setScrollMargin(20, 100)
  textEditor.renderer.setPadding(20)
  textEditor.renderer.setShowGutter(false)

  var currentFile = null

  var currentTransaction = NO_TRANSACTION
  var lastSave = NO_TRANSACTION

  textEditor.setFile = function (fileObject) {
    clearTimeout(saveTimer)

    if (release) {
      release()
      release = null
    }

    currentFile = fileObject

    if (fileObject) {
      release = watch(fileObject, update)
    }
  }

  function save () {
    var value = textEditor.session.getValue()
    if (currentFile) {
      try {
        var object = JSMN.parse(value)
        lastSave = object
        currentFile.set(object)
      } catch (ex) {}
    }
  }

  function update () {
    var data = currentFile ? currentFile() : null
    if (data && !deepEqual(lastSave, data)) {
      var newValue = JSMN.stringify(data || {})
      currentTransaction = newValue
      textEditor.session.setValue(newValue, -1)
      currentTransaction = NO_TRANSACTION
    }
  }

  var blurTimer = null
  textEditor.on('focus', function () {
    clearTimeout(blurTimer)
  })

  textEditor.on('blur', function () {
    clearTimeout(blurTimer)
    blurTimer = setTimeout(function () {
      if (!textEditor.isFocused()) {
        update()
      }
    }, 100)
  })

  var saveTimer = null
  textEditor.on('change', function () {
    if (currentTransaction === NO_TRANSACTION) {
      clearTimeout(saveTimer)
      saveTimer = setTimeout(save, 100)
    }
  })

  textEditor.setFile(fileObject)

  element.appendChild(el)
  return element
}
