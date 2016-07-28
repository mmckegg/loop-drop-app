var getBaseName = require('path').basename
var getExtName = require('path').extname
var h = require('lib/h')

var nextTick = require('next-tick')

module.exports = renameElement

function renameElement (fileName, saveRename, cancelRename, data) {
  var element = h('span')
  var extname = getExtName(fileName)

  element.textContent = getBaseName(fileName, extname)
  element.contentEditable = true

  element.onkeydown = function (e) {
    if (e.keyCode === 13) {
      save()
      return false
    } else if (e.keyCode === 27) {
      cancelRename()
      return false
    }
  }
  element.onblur = function handleRenameBlur (e) {
    nextTick(function () {
      if (element.parentNode) {
        // only save if still active!
        save()
      }
    })
  }

  nextTick(function () {
    selectInside(element)
  })

  return element

  // scoped

  function save () {
    var value = element.textContent.trim() + extname
    if (value !== fileName) {
      saveRename(value)
    } else {
      cancelRename()
    }
  }
}

function selectInside (element) {
  var range = document.createRange()
  range.selectNodeContents(element)
  var sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}
