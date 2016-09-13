var Observ = require('@mmckegg/mutant/value')
var computed = require('@mmckegg/mutant/computed')
var watch = require('@mmckegg/mutant/watch')
var resolveNode = require('lib/resolve-node')
var getDirectory = require('path').dirname
var Event = require('geval')
var Property = require('lib/property')
var ProxyDict = require('@mmckegg/mutant/proxy-dict')
var SlotsDict = require('lib/slots-dict')

var ObservFile = require('lib/observ-file')
var JsonFile = require('lib/json-file')
var ExternalRouter = require('lib/external-router')
var BaseChunk = require('lib/base-chunk')
var extendParams = require('lib/extend-params')
var Param = require('lib/param')

var forEach = require('@mmckegg/mutant/for-each')
var forEachPair = require('@mmckegg/mutant/for-each-pair')

var relative = require('path').relative
var resolve = require('path').resolve

module.exports = External

function External (parentContext) {
  var context = Object.create(parentContext)

  var volume = Property(1)
  var overrideVolume = Property(1)

  context.slotLookup = ProxyDict(null, {
    onRemove: onSlotsChanged,
    onAdd: onSlotsChanged
  })

  var obs = BaseChunk(context, {
    src: Observ(),
    offset: Param(parentContext, 0),
    routes: ExternalRouter(context, {output: '$default'}, computed([volume, overrideVolume], multiply)),
    paramValues: SlotsDict(parentContext),
    volume: volume
  })

  // expose shape to external chunk instances
  context.shape = obs.shape
  context.offset = obs.offset
  context.flags = obs.flags
  context.chokeAll = obs.chokeAll
  context.activeSlots = obs.activeSlots

  if (context.setup) {
    obs.selected = computed([obs.id, context.setup.selectedChunkId], function (id, selectedId) {
      return id === selectedId
    })
  }

  var triggerOn = obs.triggerOn
  var triggerOff = obs.triggerOff

  obs.triggerOn = function (id, at) {
    if (obs.node && obs.node.triggerOn) {
      obs.node.triggerOn(id, at)
    }
    return triggerOn(id, at)
  }

  obs.triggerOff = function (id, at) {
    if (obs.node && obs.node.triggerOff) {
      obs.node.triggerOff(id, at)
    }
    return triggerOff(id, at)
  }

  watchNodesChanged(context.slotLookup, obs.routes.refresh)

  context.fileObject = obs

  obs.context = context
  obs.overrideVolume = overrideVolume
  obs._type = 'ExternalNode'

  var updateFile = null
  var setting = false

  var nodeReleases = []
  var fileReleases = []

  var loading = false

  var currentNodeName = null
  obs.node = null
  obs.file = null
  obs.path = Observ()
  obs.resolved = Observ()
  obs.loaded = Observ(false)
  obs.nodeName = computed(obs.resolved, r => r && r.node || null, {nextTick: true})
  obs.inputs = computed(obs.resolved, data => data && data.inputs || [])
  obs.outputs = computed(obs.resolved, data => data && data.outputs || [])
  obs.params = computed(obs.resolved, data => data && data.params || [])
  obs.params.context = context

  var broadcastClose = null
  obs.onClose = Event(function (broadcast) {
    broadcastClose = broadcast
  })

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
      context.slotLookup.set(null)
      obs.node = null
    }

    if (obs.file) {
      obs.file.close()
      obs.file = null
      updateFile = null
    }

    while (fileReleases.length) {
      fileReleases.pop()()
    }

    while (nodeReleases.length) {
      nodeReleases.pop()()
    }

    broadcastClose()
  }

  obs.getPath = function () {
    var descriptor = obs()
    if (descriptor && descriptor.src) {
      return obs.resolvePath(descriptor.src)
    }
  }

  watch(obs.src, function (src) {
    var path = src ? resolve(parentContext.cwd, src) : null

    if (obs.file && obs.file.path() !== path) {
      while (fileReleases.length) {
        fileReleases.pop()()
      }
      obs.file.close()
      obs.file = null
      updateFile = null
    }

    if (!updateFile) {
      if (path) {
        loading = true
        obs.file = ObservFile(path)
        updateFile = JsonFile(obs.file, updateNode)
        fileReleases.push(
          watch(obs.file.path, obs.path.set)
        )
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
      while (nodeReleases.length) {
        nodeReleases.pop()()
      }

      if (obs.node && obs.node.destroy) {
        obs.node.destroy()
      }

      if (descriptor && ctor) {
        context.cwd = getDirectory(obs.file.path())
        obs.node = ctor(context)
        obs.node.set(descriptor)
        nodeReleases.push(
          watch(obs.node.resolved || obs.node, obs.resolved.set),
          obs.node(function (data) {
            if (!setting) {
              updateFile(data)
            }
          })
        )
        context.slotLookup.set(obs.node.slotLookup)
      } else {
        obs.node = null
        context.slotLookup.set(null)
      }
    }

    currentNodeName = getNode(descriptor)

    if (loading && descriptor) { // HACKS!
      loading = false
      obs.loaded.set(true)
    }
  }

  extendParams(obs)
  return obs

  // scoped

  function getNode (value) {
    return value && value[context.nodeKey || 'node'] || null
  }

  function onSlotsChanged () {
    obs.routes.refresh()
  }
}

function multiply (a, b) {
  return a * b
}

function watchNodesChanged (collectionOrLookup, fn) {
  var nodes = new global.Set()
  return collectionOrLookup(function (value) {
    var currentItems = new global.Set()
    var changed = false

    if (Array.isArray(value)) {
      forEach(collectionOrLookup, function (item) {
        currentItems.add(item)
        if (!nodes.has(item)) {
          nodes.add(item)
          changed = true
        }
      })
    } else {
      forEachPair(collectionOrLookup, function (key, item) {
        currentItems.add(item)
        if (!nodes.has(item)) {
          nodes.add(item)
          changed = true
        }
      })
    }

    Array.from(nodes.values()).forEach(function (node) {
      if (!currentItems.has(node)) {
        nodes.delete(node)
        changed = true
      }
    })

    if (changed) {
      fn()
    }
  })
}
