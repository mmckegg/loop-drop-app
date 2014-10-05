var Observ = require('observ')
var Event = require('geval')
var watch = require('observ/watch')

module.exports = FileObject

function FileObject(context){
  var node = Observ({})

  var removeListener = null
  var onLoad = null
  node.onLoad = Event(function(broadcast){
    onLoad = broadcast
  })

  node.file = null

  node.load = function(src){
    if (removeListener){
      removeListener()
      removeListener = null
    }
    if (src){
      node.file = context.project.getFile(src, onLoad)
      node.path = node.file.path
      removeListener = watch(node.file, update)
    }
  }

  node.destroy = function(){
    if (node.file){
      node.file.close()
      node.file = null
    }
    if (removeListener){
      removeListener()
    }
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