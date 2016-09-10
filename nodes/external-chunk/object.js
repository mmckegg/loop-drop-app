var Observ = require('@mmckegg/mutant/value')
var computed = require('@mmckegg/mutant/computed')
var watch = require('@mmckegg/mutant/watch')
var resolveNode = require('lib/resolve-node')
var getDirectory = require('path').dirname
var Event = require('geval')

var relative = require('path').relative
var resolve = require('path').resolve

var ObservFile = require('lib/observ-file')
var JsonFile = require('lib/json-file')

module.exports = External

function External (parentContext) {
  var context = Object.create(parentContext)

  var obs = Observ({})
  obs.context = context
  context.fileObject = obs

  obs._type = 'ExternalNode'

  var updateFile = null
  var setting = false

  var releaseCC = null
  var releaseResolved = null
  var releaseInstance = null
  var releaseRename = null
  var loading = false

  var currentNodeName = null
  obs.node = null
  obs.file = null
  obs.path = Observ()
  obs.controllerContext = Observ()
  obs.resolved = Observ()
  obs.loaded = Observ(false)

  var broadcastClose = null
  obs.onClose = Event(function (broadcast) {
    broadcastClose = broadcast
  })

  obs.id = computed(obs.resolved, v => v && v.id || null)
  obs.id.context = context
  obs.id.set = function (value) {
    obs.node.id.set(value)
  }

  obs.resolvePath = function (src) {
    return resolve(context.cwd, src)
  }

  obs.relative = function (path) {
    var value = relative(context.cwd, path)
    if (/^\./.exec(value)) {
      return value
    } else {
      return './' + value
    }
  }

  obs.destroy = function () {
    if (obs.node && obs.node.destroy) {
      obs.node.destroy()
      obs.node = null
    }

    if (obs.file) {
      obs.file.close()
      obs.file = null
      updateFile = null
    }

    if (releaseInstance) {
      releaseInstance()
      releaseInstance = null
    }

    broadcastClose()
  }

  obs.getPath = function () {
    var descriptor = obs()
    if (descriptor && descriptor.src) {
      return obs.resolvePath(descriptor.src)
    }
  }

  watch(obs, function (descriptor) {
    var path = (descriptor && descriptor.src) ? resolve(parentContext.cwd, descriptor.src) : null

    if (obs.file && obs.file.path() !== path) {
      releaseRename()
      releaseRename = null
      obs.file.close()
      obs.file = null
      updateFile = null
    }

    if (!updateFile) {
      if (path) {
        loading = true
        obs.file = ObservFile(path)
        updateFile = JsonFile(obs.file, updateNode)
        releaseRename = watch(obs.file.path, obs.path.set)
      }
    }
  })

  function updateNode (descriptor) {
    var ctor = descriptor && resolveNode(context.nodes, getNode(descriptor))
    if (obs.node && descriptor && obs && currentNodeName && getNode(descriptor) === currentNodeName) {
      setting = true
      obs.node.set(descriptor)
      setting = false
    } else {
      if (releaseResolved) {
        releaseResolved()
        releaseResolved = null
      }

      if (releaseInstance) {
        releaseInstance()
        releaseInstance = null
      }

      if (obs.node && obs.node.destroy) {
        obs.node.destroy()

        if (releaseCC) {
          releaseCC()
          releaseCC = null
          obs.controllerContext.set(null)
          obs.resolved.set(null)
        }
      }

      obs.node = null

      if (descriptor && ctor) {
        context.cwd = getDirectory(obs.file.path())
        obs.node = ctor(context)
        obs.node.set(descriptor)
        releaseResolved = watch(obs.node.resolved || obs.node, obs.resolved.set)
        releaseInstance = obs.node(function (data) {
          if (!setting) {
            updateFile(data)
          }
        })
        if (obs.node.controllerContext) {
          releaseCC = watch(obs.node.controllerContext, obs.controllerContext.set)
        }
      }
    }

    currentNodeName = getNode(descriptor)

    if (loading && descriptor) { // HACKS!
      loading = false
      obs.loaded.set(true)
    }
  }

  obs.nodeName = computed(obs.resolved, r => r && r.node || null)
  return obs

  // scoped

  function getNode (value) {
    return value && value[context.nodeKey || 'node'] || null
  }
}
