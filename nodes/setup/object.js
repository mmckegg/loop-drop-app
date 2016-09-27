var ObservStruct = require('@mmckegg/mutant/struct')
var Slots = require('lib/slots')
var Observ = require('@mmckegg/mutant/value')
var watch = require('@mmckegg/mutant/watch')
var computed = require('@mmckegg/mutant/computed')
var Event = require('geval')
var updateParamReferences = require('lib/update-param-references')
var lookup = require('@mmckegg/mutant/lookup')
var merge = require('@mmckegg/mutant/merge')

var join = require('path').join
var extend = require('xtend')

var Property = require('lib/property')
var YankSilence = require('lib/yank-silence')
var setRoute = require('lib/set-route')
var assignAvailablePort = require('lib/assign-available-port')
var destroyAll = require('lib/destroy-all')
var importAssociatedFiles = require('lib/import-associated-files')
var Cleaner = require('lib/cleaner')

module.exports = Setup

function Setup (parentContext) {
  var context = Object.create(parentContext)
  var audioContext = context.audio
  var node = ObservStruct({
    controllers: Slots(context),
    chunks: Slots(context),
    selectedChunkId: Observ(),
    volume: Property(1),
    globalScale: Property({
      offset: 0,
      notes: [0, 2, 4, 5, 7, 9, 11]
    })
  })

  node.overrideVolume = Property(1)
  node.overrideLowPass = Property(0)
  node.overrideHighPass = Property(0)

  node._type = 'LoopDropSetup'
  node.constructor = Setup

  context.cleaner = Cleaner(context.audio)
  context.setup = node
  context.globalScale = node.globalScale

  // main output
  context.output = audioContext.createGain()

  // mixer FX
  var outputLowPass = audioContext.createBiquadFilter()
  outputLowPass.Q.value = 0
  var outputHighPass = audioContext.createBiquadFilter()
  outputHighPass.Q.value = 0
  outputHighPass.type = 'highpass'

  context.output.connect(outputLowPass)
  outputLowPass.connect(outputHighPass)
  node.output = YankSilence(audioContext, outputHighPass)
  node.output.connect(parentContext.output)

  context.active = node.output.active

  node.onTrigger = Event(function (b) {
    context.triggerEvent = b
  })

  var releases = [
    watch(computed([node.volume, node.overrideVolume], (a, b) => a * b), function (value) {
      node.output.gain.value = value
    }),

    watch(node.overrideLowPass, function (value) {
      outputLowPass.frequency.setTargetAtTime(interpolate(value, 20000, 20, 'exp'), audioContext.currentTime, 0.01)
    }),

    watch(node.overrideHighPass, function (value) {
      outputHighPass.frequency.setTargetAtTime(interpolate(value, 20, 15000, 'exp'), audioContext.currentTime, 0.01)
    }),

    node.onTrigger(function (event) {
      if (event.id) {
        node.output.trigger()
        var split = event.id.split('/')
        var chunk = context.chunkLookup.get(split[0])
        var slotId = split[1]
        if (chunk) {
          if (event.event === 'start' && (event.triggered || event.time >= context.audio.currentTime - 0.001)) {
            chunk.triggerOn(slotId, event.time)
          } else if (event.event === 'stop') {
            chunk.triggerOff(slotId, event.time)
          }
        }
      }
    })
  ]

  node.chunks.resolveAvailable = function (id) {
    var base = id
    var lookup = context.chunkLookup()
    var incr = 0

    while (lookup[id]) {
      incr += 1
      id = base + ' ' + (incr + 1)
    }

    return id
  }

  // deprecated: use chunks.resolveAvailable
  node.resolveAvailableChunk = node.chunks.resolveAvailable

  node.destroy = function () {
    while (releases.length) {
      releases.pop()()
    }
    destroyAll(node)
    context.cleaner.destroy()
  }

  // enforce controller types
  node.controllers.onAdd(function (controller) {
    if (controller.port) {
      assignAvailablePort(controller)
    }
  })

  context.chunkLookup = lookup(node.chunks, 'id')

  // extend param lookup
  var lookups = []
  if (context.paramLookup) {
    lookups.push(context.paramLookup)
  }

  lookups.push(
    // modulator chunks
    lookup(node.chunks, function (chunk) {
      if (chunk && chunk.currentValue) {
        return chunk.id
      }
    })
  )

  context.paramLookup = merge(lookups)
  node.context = context

  node.grabInput = function () {
    var length = node.controllers.getLength()
    for (var i = 0; i < length; i++) {
      var controller = node.controllers.get(i)
      if (controller && controller.grabInput) {
        controller.grabInput()
      }
    }

    // now focus the selected chunk
    if (node.selectedChunkId) {
      var chunkId = node.selectedChunkId()
      for (var i = 0; i < length; i++) {
        var controller = node.controllers.get(i)
        if (controller) {
          var chunkPositions = controller().chunkPositions || {}
          if (controller.grabInput && chunkPositions[chunkId]) {
            controller.grabInput()
          }
        }
      }
    }
  }

  node.importChunk = function (descriptor, originalDirectory, cb) {
    var info = context.nodeInfo.lookup[descriptor.node]
    var id = node.chunks.resolveAvailable(descriptor.id)
    var targetPath = join(context.cwd, id + '.json')

    descriptor = extend(descriptor, { id: id })

    importAssociatedFiles(descriptor, originalDirectory, context.cwd, function (err) {
      if (err) return cb && cb(err)
      if (info.external) {
        // duplicate external file
        context.fs.writeFile(targetPath, JSON.stringify(descriptor), function (err) {
          if (err) return cb && cb(err)
          node.chunks.push({
            node: 'externalChunk',
            src: context.fileObject.relative(targetPath)
          })
          cb && cb(null, id)
        })
      } else {
        // duplicate local chunk
        node.chunks.push(descriptor)
        cb && cb(null, id)
      }
    })

    return id
  }

  node.updateChunkReferences = function (oldId, newId) {
    node.controllers.forEach(function (controller) {
      if (controller.chunkPositions && controller.chunkPositions()) {
        var value = controller.chunkPositions()[oldId]
        if (value && controller.chunkPositions.put) {
          controller.chunkPositions.delete(oldId)
          if (newId) {
            controller.chunkPositions.put(newId, value)
          }
        }
      }

      if (controller.chunkIds && controller.chunkIds()) {
        controller.chunkIds.set(controller.chunkIds().map(x => x === oldId ? newId : x))
      }
    })

    updateParamReferences(node.chunks, oldId, newId)

    // check for routes matching chunk id
    node.chunks.forEach(function (chunk) {
      updateRouteReferences(chunk, oldId, newId)
    })

    if (node.selectedChunkId() === oldId){
      node.selectedChunkId.set(newId)
    }
  }

  return node
}

function getResolved (node) {
  return node && node.resolved || node
}

function resolveInner (node) {
  return node && node.node || node
}

function updateRouteReferences (chunk, oldId, newId) {
  var routes = chunk.routes || (chunk.node && chunk.node.routes)
  if (routes) {
    routes = routes()
    Object.keys(routes).forEach(function (key) {
      var value = routes[key]
      var match = typeof value === 'string' && value.match(/^(.+)#(.+)$/)
      if (match && match[1] === oldId) {
        if (newId) {
          setRoute(chunk, key, newId + '#' + match[2])
        } else {
          setRoute(chunk, key, '$default')
        }
      }
    })
  }
}

function interpolate (pos, min, max, mode) {
  if (mode === 'exp') {
    if (min < max) {
      return min + (pos * pos) * (max - min)
    } else {
      var i = 1 - pos
      return max + (i * i) * (min - max)
    }
  } else { // linear
    if (min < max) {
      return min + pos * (max - min)
    } else {
      return max + (1 - pos) * (min - max)
    }
  }
}
