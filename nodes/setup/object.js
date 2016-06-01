var ObservStruct = require('observ-struct')
var NodeArray = require('observ-node-array')
var Observ = require('observ')
var watch = require('observ/watch')
var computed = require('observ/computed')
var Event = require('geval')
var getDirName = require('path').dirname
var getBaseName = require('path').basename
var join = require('path').join
var relative = require('path').relative
var updateParamReferences = require('lib/update-param-references')

var map = require('observ-node-array/map')
var lookup = require('observ-node-array/lookup')
var merge = require('observ-node-array/merge')

var Property = require('observ-default')
var YankSilence = require('lib/yank-silence')
var setRoute = require('lib/set-route')
var assignAvailablePort = require('lib/assign-available-port')
var destroyAll = require('lib/destroy-all')

module.exports = Setup

function Setup(parentContext){

  var context = Object.create(parentContext)
  var audioContext = context.audio
  var refreshingParamCount = false

  var node = ObservStruct({
    controllers: NodeArray(context),
    chunks: NodeArray(context),
    selectedChunkId: Observ(),
    volume: Property(1),
    globalScale: Property({
      offset: 0,
      notes: [0,2,4,5,7,9,11]
    })
  })

  node.overrideVolume = Property(1)
  node.overrideLowPass = Property(0)
  node.overrideHighPass = Property(0)

  node._type = 'LoopDropSetup'

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

  watch(computed([node.volume, node.overrideVolume], (a, b) => a * b), function (value) {
    node.output.gain.value = value
  })

  watch(node.overrideLowPass, function (value) {
    outputLowPass.frequency.setTargetAtTime(interpolate(value, 20000, 20, 'exp'), audioContext.currentTime, 0.01)
  })

  watch(node.overrideHighPass, function (value) {
    outputHighPass.frequency.setTargetAtTime(interpolate(value, 20, 15000, 'exp'), audioContext.currentTime, 0.01)
  })

  node.onTrigger = Event(function (b) {
    context.triggerEvent = b
  })

  node.onTrigger(function (event) {
    if (event.id) {
      node.output.trigger()
      var split = event.id.split('/')
      var chunk = context.chunkLookup.get(split[0])
      var slotId = split[1]
      if (chunk){
        if (event.event === 'start'){
          chunk.triggerOn(slotId, event.time)
        } else if (event.event === 'stop'){
          chunk.triggerOff(slotId, event.time)
        }
      }
    }
  })

  node.chunks.resolveAvailable = function(id){
    var base = id
    var lookup = context.chunkLookup()
    var incr = 0

    while (lookup[id]){
      incr += 1
      id = base + ' ' + (incr + 1)
    }

    return id
  }

  // deprecated: use chunks.resolveAvailable
  node.resolveAvailableChunk = node.chunks.resolveAvailable

  node.destroy = function(){
    destroyAll(node)
    context.paramLookup.destroy()
  }

  // maps and lookup
  node.controllers.resolved = map(node.controllers, resolve)
  node.chunks.resolved = map(node.chunks, resolve)
  node.chunks.lookup = lookup(node.chunks, function(x){
    var descriptor = get(x)
    return descriptor && descriptor.id || undefined
  })

  // enforce controller types
  node.controllers.onUpdate(function (update) {
    update.slice(2).forEach(function (controller) {
      if (controller.port) {
        assignAvailablePort(controller)
      }
    })
  })

  context.chunkLookup = lookup(node.chunks, function(x){
    if (x){
      var data = x.resolved ? x.resolved() : x()
      return data && data.id || undefined
    }
  }, resolve, resolveInner)


  // extend param lookup
  var lookups = []
  if (context.paramLookup) {
    lookups.push(context.paramLookup)
  }

  lookups.push(
    lookup(node.chunks, function(x){
      if (x && x.onSchedule){
        return x.id()
      }
    }, resolve, resolveInner)
  )

  context.paramLookup = merge(lookups)
  node.context = context

  node.resolved = ObservStruct({
    selectedChunkId: node.selectedChunkId,
    controllers: node.controllers.resolved,
    chunks: node.chunks.resolved,
    paramCount: Observ(0)
  })

  context.paramLookup(refreshParamCount)

  node.grabInput = function(){
    var length = node.controllers.getLength()
    for (var i=0;i<length;i++){
      var controller = node.controllers.get(i)
      if (controller.grabInput){
        controller.grabInput()
      }
    }

    // now focus the selected chunk
    if (node.selectedChunkId){
      var chunkId = node.selectedChunkId()
      for (var i=0;i<length;i++){
        var controller = node.controllers.get(i)
        var chunkPositions = controller().chunkPositions || {}
        if (controller.grabInput && chunkPositions[chunkId]){
          controller.grabInput()
        }
      }
    }
  }

  node.updateChunkReferences = function(oldId, newId){
    node.controllers.forEach(function(controller){
      if (controller.chunkPositions && controller.chunkPositions()){
        var value = controller.chunkPositions()[oldId]
        if (value && controller.chunkPositions.put){
          controller.chunkPositions.delete(oldId)
          if (newId) {
            controller.chunkPositions.put(newId, value)
          }
        }
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

  // scoped

  function refreshParamCount () {
    if (!refreshingParamCount) {
      refreshingParamCount = true
      process.nextTick(refreshParamCountNow)
    }
  }

  function refreshParamCountNow () {
    refreshingParamCount = false
    var count = Object.keys(context.paramLookup()).length
    if (count !== node.resolved.paramCount()) {
      node.resolved.paramCount.set(count)
    }
  }
}

function get(obs){
  return typeof obs == 'function' ? obs() : obs
}

function resolve(node){
  return node && node.resolved || node
}

function resolveInner(node){
  return node && node.node || node
}

function updateRouteReferences (chunk, oldId, newId) {
  var routes = chunk.routes || (chunk.node && chunk.node.routes)
  if (routes) {
    routes = routes()
    Object.keys(routes).forEach(function (key) {
      var value = routes[key]
      var match = typeof value == 'string' && value.match(/^(.+)#(.+)$/)
      if (match && match[1] === oldId){
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
