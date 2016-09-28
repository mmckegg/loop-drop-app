var h = require('lib/h')
var JSMN = require('lib/jsmn.js')
var deepEqual = require('deep-equal')
var watch = require('@mmckegg/mutant/watch')

var ace = require('brace')
require('brace/mode/javascript')
require('brace/theme/ambiance')

var NO_TRANSACTION = {}

module.exports = RawEditor

function RawEditor (fileObject) {
  return h('RawEditor', {
    hooks: [
      RawEditorHook(fileObject)
    ]
  })
}

function RawEditorHook (fileObject) {
  return function (element) {
    var el = document.createElement('div')

    var textEditor = ace.edit(el)
    var release = null
    var lastValue = ''

    textEditor.setTheme('ace/theme/ambiance')
    textEditor.session.setUseWorker(false)
    textEditor.session.setMode('ace/mode/javascript')
    textEditor.session.setTabSize(2)
    textEditor.renderer.setScrollMargin(20, 100)
    textEditor.renderer.setPadding(20)
    textEditor.renderer.setShowGutter(false)
    textEditor.$blockScrolling = Infinity

    var currentFile = null
    var saving = false

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
      if (currentFile && value !== lastValue) {
        lastValue = value
        saving = true
        try {
          var object = JSMN.parse(value)
          currentFile.set(object)
        } catch (ex) {}
        saving = false
      }
    }

    function update () {
      if (!saving) {
        var data = currentFile ? currentFile() : null
        var newValue = JSMN.stringify(data || {})
        if (newValue !== lastValue) {
          lastValue = newValue
          textEditor.session.setValue(newValue, -1)
        }
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
      clearTimeout(saveTimer)
      saveTimer = setTimeout(save, 100)
    })

    textEditor.setFile(fileObject)

    element.appendChild(el)

    return function () {
      textEditor.destroy()
      if (release) {
        release()
        release = null
      }
    }
  }
}
