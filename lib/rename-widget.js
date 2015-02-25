var getBaseName = require('path').basename
var getExtName = require('path').extname

var nextTick = require('next-tick')

function renameElement(fileName, saveRename, cancelRename, data){ 
  if (!(this instanceof renameElement)) return new renameElement(fileName, saveRename, cancelRename, data) 
  this.fileName = fileName
  this.saveRename = saveRename
  this.cancelRename = cancelRename
  this.data = data
}
renameElement.prototype.type = 'Widget'
renameElement.prototype.init = function(){
  var element = document.createElement('span')
  this.element = element
  element.context = this
  element.dataset.extname = getExtName(this.fileName)
  element.textContent = getBaseName(this.fileName, element.dataset.extname)
  element.onkeydown = function(e){
    if (event.keyCode === 13){
      element.context.saveRename()
      return false
    } else if (event.keyCode === 27){
      element.context.cancelRename()
      return false
    }
  }
  element.onblur = function handleRenameBlur(e){
    nextTick(function(){
      if (element.parentNode && element.context){
        // only save if still active!
        element.context.saveRename()
      }
    })
  }
  element.contentEditable = true
  nextTick(function(){
    selectInside(element)
  })
  return element
}
renameElement.prototype.getValue = function(){
  return this.element.textContent.trim() + this.element.dataset.extname
}
renameElement.prototype.update = function(prev, element){
  element.context = this
  this.element = element
}

function selectInside(element){
  var range = document.createRange();
  range.selectNodeContents(element);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range)
}

module.exports = renameElement