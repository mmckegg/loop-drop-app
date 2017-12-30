var resolveNode = require('lib/resolve-node')
var getDirName = require('path').dirname

var Path = require('path')

var resolve = require('mutant/resolve')
var Observ = require('mutant/value')
var Event = require('geval')
var watch = require('mutant/watch')
var computed = require('mutant/computed')
var onceIdle = require('mutant/once-idle')

var ObservFile = require('lib/observ-file')
var JsonFile = require('lib/json-file')

module.exports = FileObject

function FileObject (parentContext) {
  var context = Object.create(parentContext)
  context.cwd = Observ()

  var obs = Observ({})
  var set = obs.set

  obs.set = function (data) {
    if (obs.node) {
      obs.node.set(data)
    }
  }

  obs.file = null
  obs.context = context
  obs.loaded = Observ(false)
  obs.path = Observ()

  // add self to context
  context.fileObject = obs

  var loading = false
  var initialized = false
  var releaseInstance = null
  var releaseResolved = null
  var releaseRename = null
  var releaseClose = null
  var updateFile = null

  var currentNodeName = null
  obs.node = null

  var broadcastClose = null
  obs.onClose = Event(function (broadcast) {
    broadcastClose = broadcast
  })

  var broadcastClosing = null
  obs.onClosing = Event(function (broadcast) {
    broadcastClosing = broadcast
  })

  function updateNode (data) {
    var newNode = getNode(data)
    var instance = obs.node
    var oldInstance = instance

    if (currentNodeName !== newNode) {
      var ctor = resolveNode(context.nodes, newNode)

      if (instance) {
        releaseResolved()
        releaseInstance()
        instance.destroy && instance.destroy()
        releaseResolved = releaseInstance = instance = obs.node = null
      }

      if (ctor) {
        instance = obs.node = ctor(context)

        releaseResolved = instance.resolved
          ? instance.resolved(obs.resolved.set)
          : instance(obs.resolved.set)

        releaseInstance = instance(function (data) {
          set(data)
          // don't update the file if we are currently upading from file
          // also wait until idle before accepting update
          if (!loading && initialized) {
            updateFile(data)
          }
        })
        broadcastNode(instance)
      } else if (oldInstance) {
        obs.resolved.set(null)
        broadcastNode(null)
      }
    }

    if (instance) {
      instance.set(data)
    }

    currentNodeName = getNode(data)

    if (data && loading) {
      loading = false
      broadcastLoaded() // hacky callback for onLoad
      obs.loaded.set(true)
    }
  }

  var broadcastLoaded = null
  obs.onLoad = Event(function (broadcast) {
    broadcastLoaded = broadcast
  })

  var broadcastNode = null
  obs.onNode = Event(function (broadcast) {
    broadcastNode = broadcast
  })

  obs.resolved = Observ()

  obs.resolvePath = function (src) {
    return Path.resolve(resolve(context.cwd), src)
  }

  obs.relative = function (path) {
    var value = Path.relative(resolve(context.cwd), path)
    if (/^\./.exec(value)) {
      return value
    } else {
      return './' + value
    }
  }

  obs.load = function (path) {
    releaseClose && releaseClose()
    releaseRename && releaseRename()
    releaseRename = null

    if (obs.file) {
      obs.file.close()
      obs.file = null
    }

    if (path) {
      loading = true
      initialized = false
      onceIdle(() => { initialized = true })
      obs.file = ObservFile(path, context.fs)
      releaseRename = watch(obs.file.path, obs.path.set)
      context.cwd.set(getDirName(path))
      releaseClose = obs.file.onClose(onClose)
      updateFile = JsonFile(obs.file, updateNode)
    }
  }

  obs.close = function () {
    if (obs.file && obs.file.close) {
      broadcastClosing()
      obs.file.close()
    }
  }

  function onClose () {
    releaseClose && releaseClose()
    releaseResolved && releaseResolved()
    releaseInstance && releaseInstance()
    releaseRename && releaseRename()
    obs.node && obs.node.destroy && obs.node.destroy()
    obs.node = releaseInstance = releaseResolved = null
    obs.file = null
    broadcastClose()
    obs.loaded.set(false)
  }

  obs.nodeName = computed(obs.resolved, r => r && r.node || null)

  obs.destroy = function () {
    releaseClose && releaseClose()
    releaseResolved && releaseResolved()
    releaseInstance && releaseInstance()
    releaseRename && releaseRename()

    if (obs.file) {
      obs.file.close()
      obs.file = null
    }

    if (obs.node && obs.node.destroy) {
      obs.node.destroy()
    }
  }

  return obs

  // scoped

  function getNode (value) {
    return value && value[context.nodeKey || 'node'] || null
  }
}
