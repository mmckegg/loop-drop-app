var Observ = require('observ')
var extend = require('xtend')
var computed = require('observ/computed')
var watch = require('observ/watch')
var Event = require('geval')
var nextTick = require('next-tick')
var resolveNode = require('observ-node-array/resolve')
var getDirectory = require('path').dirname

var relative = require('path').relative
var resolve = require('path').resolve

var ObservFile = require('observ-fs/file')
var JsonFile = require('lib/json-file')

module.exports = External

function External(parentContext){  

  var context = Object.create(parentContext)

  var obs = Observ({})
  obs.context = context
  context.fileObject = obs

  obs._type = 'ExternalNode'

  var additionalParams = getAdditional(obs)
  var externalParams = null

  var release = null
  var releaseCC = null

  var nodeContext = Object.create(context)

  var lastDescriptor = null
  obs.node = null
  obs.file = null
  obs.controllerContext = Observ()
  obs.resolved = Observ()

  obs.resolvePath = function(src){
    return resolve(context.cwd, src)
  }

  obs.relative = function(path){
    var value = relative(context.cwd, path)
    if (/^\./.exec(value)){
      return value
    } else {
      return './' + value
    }
  }

  obs.destroy = function(){
    if (obs.node && obs.node.destroy){
      obs.node.destroy()
      obs.node = null
    }

    if (obs.file) {
      obs.file.close()
      obs.file = null
    }

    if (release){
      release()
      release = null
      externalParams = null
    }
  }

  obs.getPath = function() {
    var descriptor = obs()
    if (descriptor && descriptor.src) {
      return obs.resolvePath(descriptor.src)
    }
  }

  watch(obs, function(descriptor){
    if (externalParams && externalParams.src != descriptor.src){
      release()
      release = null
      externalParams = null
      if (obs.file) {
        obs.file.close()
        obs.file = null
      }
    }

    if (!externalParams){
      if (descriptor.src){
        var path = resolve(parentContext.cwd, descriptor.src)
        context.fs.exists(path, function(exists){
          if (exists){
            release&&release()
            obs.file = ObservFile(path, context.fs)
            externalParams = JsonFile(obs.file)
            externalParams.src = descriptor.src
            release = watch(externalParams, update)
          }
        })
      }
    } else {
      update()
    }
  })

  function update(){
    var descriptor = extend(externalParams(), additionalParams())
    var ctor = descriptor && resolveNode(context.nodes, descriptor.node)


    if (obs.node && descriptor && obs && lastDescriptor && descriptor.node == lastDescriptor.node){
      obs.node.set(descriptor)
      obs.resolved.set(descriptor)
    } else {

      if (obs.node && obs.node.destroy){
        obs.node.destroy()

        if (releaseCC){
          releaseCC()
          releaseCC = null
          obs.controllerContext.set(null)
          obs.resolved.set(null)
        }
      }

      obs.node = null

      if (descriptor && ctor){
        context.cwd = getDirectory(obs.file.path)
        obs.node = ctor(context)
        obs.node.nodeName = descriptor.node
        obs.node.set(descriptor)

        if (obs.node.controllerContext){
          releaseCC = watch(obs.node.controllerContext, obs.controllerContext.set)
        }

        obs.resolved.set(descriptor)
      }
    }

    lastDescriptor = descriptor 
  }

  return obs
}

function getAdditional(obs){
  return computed([obs], function(a){
    return Object.keys(a).reduce(function(res, key){
      if (key !== 'node' && key !== 'src'){
        res[key] = a[key]
      }
      return res
    }, {})
  })
}

function resolveNode(nodes, nodeName){
  if (!nodeName){
    return null
  }
  var node = nodes || {}
  while (nodeName && node){
    var index = nodeName.indexOf('/')
    if (index < 0){
      node = node[nodeName]
      nodeName = null
    } else {
      var key = nodeName.slice(0, index)
      nodeName = nodeName.slice(index+1)
      node = node[key]
    }
  }
  return node
}