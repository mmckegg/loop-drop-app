var Observ = require('observ')
var Event = require('geval')
var watch = require('observ/watch')
var getDirName = require('path').dirname
var getBaseName = require('path').basename
var join = require('path').join

module.exports = FileObject

function FileObject(context){
  var node = Observ({})

  var removeListener = null
  var removeCloseListener = null
  var onLoad = null
  node.onLoad = Event(function(broadcast){
    onLoad = broadcast
  })

  var onClose = null
  node.onClose = Event(function(broadcast){
    onClose = broadcast
  })

  node.file = null

  function release(){
    if (removeListener){
      removeListener()
      removeCloseListener()
      removeListener = null
      removeCloseListener = null
    }
  }

  node.load = function(src){
    if (src){
      node.file = context.project.getFile(src, onLoad)
      node.path = node.file.path
      removeListener = watch(node.file, update)
      removeCloseListener = node.file.onClose(onClose)
    }
  }


  node.rename = function(newFileName){
    if (node.file){
      var currentFileName = getBaseName(node.file.path)
      if (newFileName !== currentFileName){
        var directory = getDirName(node.file.path)
        var newPath = join(directory, newFileName)
        var src = context.project.relative(newPath)

        release()

        var file = context.project.getFile(src)
        file.set(node.file())
        node.file.delete()
        node.file = file
        node.path = node.file.path
        removeListener = watch(node.file, update)
        removeCloseListener = node.file.onClose(onClose)
      }
    }
  }

  node.destroy = function(){
    if (node.file){
      node.file.close()
      node.file = null
    }
    release()
  }

  function update(data){
    var obj = {}
    
    try {
      obj = JSON.parse(data || '{}') || {}
    } catch (ex) {}

    obj._path = node.path
    node.set(obj || {})
  }

  return node
}