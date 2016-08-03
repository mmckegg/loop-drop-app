var resolveNode = require('observ-node-array/resolve')
var deepEqual = require('deep-equal')
var getDirName = require('path').dirname

var resolve = require('path').resolve
var relative = require('path').relative

var Observ = require('observ')
var Event = require('geval')
var watch = require('observ/watch')
var computed = require('@mmckegg/mutant/computed')

var ObservFile = require('lib/observ-file')
var JsonFile = require('lib/json-file')

var NO_TRANSACTION = {}

module.exports = FileObject

function FileObject(parentContext){

  var context = Object.create(parentContext)

  var obs = Observ({})
  obs.file = null
  obs.context = context
  obs.loadedPath = Observ()

  // add self to context
  context.fileObject = obs

  var parsedFile = null

  var loading = false
  var releaseFile = null
  var releaseInstance = null
  var releaseResolved = null
  var releaseClose = null
  var currentTransaction = NO_TRANSACTION

  var lastData = {}
  obs.node = null

  obs(function(data){
    if (parsedFile && data === parsedFile()){
      updateNode(data)
    } else if (parsedFile && data !== parsedFile()){
      // push update to file

      if (getNode(lastData) !== getNode(data)){
        updateNode(data)
      }

      parsedFile.set(data)
    }
  })

  var broadcastClose = null
  obs.onClose = Event(function(broadcast){
    broadcastClose = broadcast
  })

  function updateNode(data){
    if (data !== lastData){
      var oldNode = getNode(lastData)
      var newNode = getNode(data)
      var instance = obs.node
      var oldInstance = instance

      if (oldNode !== newNode){
        var ctor = resolveNode(context.nodes, newNode)

        if (instance){
          releaseResolved()
          releaseInstance()
          instance.destroy && instance.destroy()
          releaseResolved = releaseInstance = instance = obs.node = null
        }

        if (ctor){
          instance = obs.node = ctor(context)

          releaseResolved = instance.resolved ?
            instance.resolved(obs.resolved.set) :
            instance(obs.resolved.set)

          releaseInstance = instance(function(data){
            if (currentTransaction === NO_TRANSACTION){
              obs.set(data)
            }
          })
          broadcastNode(instance)
        } else if (oldInstance){
          obs.resolved.set(null)
          broadcastNode(null)
        }

      }

      if (instance){
        currentTransaction = data
        instance.set(data)
        currentTransaction = NO_TRANSACTION
      }

      lastData = data

      if (data && loading){
        loading = false
        broadcastLoaded() // hacky callback for onLoad
        obs.loadedPath.set(obs.file.path)
      }
    }
  }

  var broadcastLoaded = null
  obs.onLoad = Event(function(broadcast){
    broadcastLoaded = broadcast
  })

  var broadcastNode = null
  obs.onNode = Event(function(broadcast){
    broadcastNode = broadcast
  })

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

  obs.load = function(path){

    releaseClose&&releaseClose()

    if (path){
      loading = true
      obs.file = ObservFile(path)
      obs.path = obs.file.path
      context.cwd = getDirName(obs.file.path)
      releaseClose = obs.file.onClose(onClose)
      switchTo(JsonFile(obs.file))
    } else {
      obs.file = null
      switchTo(null)
    }
  }

  obs.close = function(){
    if (obs.file&&obs.file.close){
      obs.file.close()
    }
  }

  function onClose(){
    releaseClose&&releaseClose()
    releaseResolved&&releaseResolved()
    releaseInstance&&releaseInstance()
    obs.node && obs.node.destroy && obs.node.destroy()
    obs.node = releaseInstance = releaseResolved = null
    obs.file = null
    switchTo(null)
    broadcastClose()
    obs.loadedPath.set(null)
  }

  obs.nodeName = computed(obs.resolved, r => r && r.node || null)
  return obs

  // scoped

  function switchTo(target){
    if (releaseFile){
      releaseFile()
      releaseFile = null
    }

    if (parsedFile){
      parsedFile.destroy()
      parsedFile = null
    }

    if (target){
      parsedFile = target
      releaseFile = target() ? watch(target, obs.set) : target(obs.set)
    } else {
      obs.set(null)
    }
  }

  function getNode(value){
    return value && value[context.nodeKey||'node'] || null
  }

}
