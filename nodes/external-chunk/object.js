var Observ = require('mutant/value')
var computed = require('mutant/computed')
var watch = require('mutant/watch')
var resolveNode = require('lib/resolve-node')
var Event = require('geval')
var Property = require('lib/property')
var ProxyDict = require('mutant/proxy-dict')
var MutantMappedDict = require('mutant/mapped-dict')
var onceIdle = require('mutant/once-idle')

var ObservFile = require('lib/observ-file')
var JsonFile = require('lib/json-file')
var ExternalRouter = require('lib/external-router')
var BaseChunk = require('lib/base-chunk')
var extendParams = require('lib/extend-params')
var Param = require('lib/param')
var resolve = require('mutant/resolve')
var watchNodesChanged = require('lib/watch-nodes-changed')
var doubleBind = require('lib/double-bind')

var Path = require('path')

module.exports = External

function External (parentContext) {
  var context = Object.create(parentContext)
  context.cwd = Observ()

  var volume = Property(1)
  var overrideVolume = Property(1)

  context.output = context.audio.createGain()
  context.output.connect(parentContext.output)

  context.slotLookup = ProxyDict(null, {
    onRemove: onSlotsChanged,
    onAdd: onSlotsChanged
  })

  var obs = BaseChunk(context, {
    src: Observ(),
    offset: Param(parentContext, 0),
    routes: ExternalRouter(context, {output: '$default'}, computed([volume, overrideVolume], multiply)),
    paramValues: MutantMappedDict([], (key, item) => {
      var param = Param(context)
      doubleBind(item, param)
      param.triggerOn(context.audio.currentTime)
      return [key, param]
    }),
    volume: volume
  })

  obs.offset.triggerOn(context.audio.currentTime)

  // expose shape to external chunk instances
  context.shape = obs.shape
  context.offset = obs.offset
  context.flags = obs.flags
  context.chokeAll = obs.chokeAll
  context.activeSlots = obs.activeSlots
  context.paramValues = obs.paramValues

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

  var initialized = false // wait for onceIdle after load before accpting data back
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

    unwatchPath()
    broadcastClose()
    Param.destroy(obs)
  }

  obs.getPath = function () {
    var descriptor = obs()
    if (descriptor && descriptor.src) {
      return obs.resolvePath(descriptor.src)
    }
  }

  var path = computed([parentContext.cwd, obs.src], (a, b) => a && b && Path.resolve(a, b) || null)

  var unwatchPath = watch(path, function (path) {
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
        initialized = false
        onceIdle(() => { initialized = true })
        loading = true
        obs.file = ObservFile(path)
        updateFile = JsonFile(obs.file, updateNode)
        context.cwd.set(Path.dirname(path))
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
        obs.node = ctor(context)
        obs.node.set(descriptor)
        nodeReleases.push(
          watch(obs.node.resolved || obs.node, obs.resolved.set),
          obs.node(function (data) {
            // don't update the file if we are currently upading from file
            // also wait until idle before accepting update
            if (!setting && initialized) {
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
