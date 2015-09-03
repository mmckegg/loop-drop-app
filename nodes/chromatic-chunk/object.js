
var ObservStruct = require('observ-struct')
var Observ = require('observ')
var Property = require('observ-default')
var ObservVarhash = require('observ-varhash')
var NodeArray = require('observ-node-array')
var NodeVarhash = require('observ-node-array/varhash')
var SingleNode = require('observ-node-array/single')

var ArrayGrid = require('array-grid')

var computed = require('observ/computed')
var lookup = require('observ-node-array/lookup')
var merge = require('observ-node-array/merge')
var watch = require('observ/watch')
var nextTick = require('next-tick')
var deepEqual = require('deep-equal')
var ExternalRouter = require('lib/external-router')

var Param = require('audio-slot-param')
var applyParams = require('lib/apply-params')

module.exports = ChromaticChunk

function ChromaticChunk (parentContext) {

  var context = Object.create(parentContext)

  var output = context.output = context.audio.createGain()
  context.output.connect(parentContext.output)

  var scaleSlots = NodeArray(context)

  var defaultScale = {
    offset: 0,
    notes: [0,2,4,5,7,9,11]
  }

  var volume = Property(1)
  var obs = ObservStruct({
    id: Observ(),
    shape: Property([1,4]),

    templateSlot: SingleNode(context),

    scale: Property(defaultScale),
    offset: Param(parentContext, 0),

    slots: NodeArray(context),
    inputs: Property([]),
    outputs: Property(['output']),
    volume: volume,

    params: Property([]),
    paramValues: NodeVarhash(parentContext),

    routes: ExternalRouter(context, {output: '$default'}, volume),
    flags: Property([]),
    chokeAll: Property(false),
    color: Property([255,255,255]),
    selectedSlotId: Observ()
  })

  context.offset = obs.offset

  var globalScale = Property(defaultScale)
  if (context.globalScale){
    var releaseGlobalScale = watch(context.globalScale, globalScale.set)
  }

  var scale = computed([obs.scale, globalScale], function(scale, globalScale){
    if (scale === '$global'){
      return globalScale
    } else if (scale instanceof Object) {
      return scale
    } else {
      return defaultScale
    }
  })

  obs.output = context.output
  obs.context = context
  context.chunk = obs

  obs.volume(function(value){
    output.gain.value = value
  })

  context.slotLookup = merge([
    lookup(scaleSlots, 'id'),
    lookup(obs.slots, 'id')
  ])

  var computedSlots = computed([obs.templateSlot, scale, obs.shape], function(template, scale, shape){
    var length = (shape[0]*shape[1])||0
    var result = []
    for (var i=0;i<length;i++){
      if (template){
        var slot = obtainWithParams(template, {
          id: String(i),
          value: i,
          scale: scale
        })
        if (slot){
          result.push(slot)
        }
      }
    }
    return result
  })

  computedSlots(scaleSlots.set)

  obs.triggerOn = function(id, at){
    var slot = context.slotLookup.get(id)

    if (obs.chokeAll()){
      scaleSlots.forEach(function(slot){
        slot.choke(at)
      })
    }

    if (slot){
      slot.triggerOn(at)
    }
  }

  obs.triggerOff = function(id, at){
    var slot = context.slotLookup.get(id)
    if (slot){
      slot.triggerOff(at)
    }
  }

  obs.getSlot = function(id){
    return context.slotLookup.get(id)
  }

  obs.triggers = computed([obs.id, obs.shape], function(id, shape){
    var length = Array.isArray(shape) && shape[0] * shape[1] || 0
    var result = []
    for (var i=0;i<length;i++){
      result.push(String(i))
    }
    return result
  })

  obs.grid = computed([obs.triggers, obs.shape], ArrayGrid)

  obs.resolvedGrid = computed([obs.triggers, obs.shape], function(triggers, shape){
    return ArrayGrid(triggers.map(getGlobalId), shape)
  })

  obs.destroy = function () {
    obs.routes.destroy()
    releaseGlobalScale && releaseGlobalScale()
    releaseGlobalScale = null
  }

  applyParams(obs)

  return obs

  // scoped

  function getGlobalId (id) {
    if (id) {
      return obs.id() + '/' + id
    }
  }
}

function getNewValue (object, value) {
  if (object instanceof Object && !Array.isArray(object)){
    var v = obtain(object)
    v.value = getNewValue(v.value, value)
    return v
  } else {
    return value
  }
}

function getValue (object, defaultValue) {
  if (object instanceof Object && !Array.isArray(object)){
    return getValue(object.value, defaultValue)
  } else {
    return object != null ? object : defaultValue
  }
}

function obtainWithParams (obj, params) {
  return JSON.parse(JSON.stringify(obj, function(k,v){
    if (v && v.$param){
      return params[v.$param]
    } else {
      return v
    }
  }))
}

function obtain (obj) {
  return JSON.parse(JSON.stringify(obj))
}

function mod (n, m) {
  return ((n%m)+m)%m
}

function getNote (scale, offset) {
  scale = Array.isArray(scale) ? scale : [0,1,2,3,4,5,6,7,8,9,10,11]
  var position = mod(offset, scale.length)
  var multiplier = Math.floor(offset/scale.length)
  return scale[position] + multiplier * 12
}
