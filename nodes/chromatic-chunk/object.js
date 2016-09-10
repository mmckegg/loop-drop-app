
var ObservStruct = require('@mmckegg/mutant/struct')
var Observ = require('@mmckegg/mutant/value')
var Property = require('lib/property')
var Slots = require('lib/slots')
var SlotsDict = require('lib/slots-dict')
var TemplateSlot = require('lib/template-slot')
var MutantArray = require('@mmckegg/mutant/array')

var ArrayGrid = require('array-grid')

var computed = require('@mmckegg/mutant/computed')
var lookup = require('@mmckegg/mutant/lookup')
var merge = require('@mmckegg/mutant/merge')
var ExternalRouter = require('lib/external-router')

var Param = require('lib/param')
var extendParams = require('lib/extend-params')
var destroyAll = require('lib/destroy-all')
var withResolved = require('lib/with-resolved')

module.exports = ChromaticChunk

function ChromaticChunk (parentContext) {
  var context = Object.create(parentContext)

  var output = context.output = context.audio.createGain()
  context.output.connect(parentContext.output)

  var defaultScale = {
    offset: 0,
    notes: [0, 2, 4, 5, 7, 9, 11]
  }

  var scale = Property(defaultScale)
  var shape = Property([1, 4])

  var computedScale = computed([scale, context.globalScale], function (scale, globalScale) {
    if (scale === '$global' && globalScale) {
      return globalScale
    } else if (scale instanceof Object) {
      return scale
    } else {
      return defaultScale
    }
  })

  var volume = Property(1)
  var overrideVolume = Property(1)

  var obs = ObservStruct({
    id: Observ(),
    offset: Param(parentContext, 0),
    volume: volume,

    shape: shape,
    scale: scale,
    templateSlot: TemplateSlot(context, shape, computedScale),

    slots: Slots(context),
    inputs: Property([]),
    outputs: Property(['output']),

    params: Property([]),
    paramValues: SlotsDict(parentContext),

    routes: ExternalRouter(context, {output: '$default'}, computed([volume, overrideVolume], multiply)),
    flags: Property([]),
    chokeAll: Property(false),
    color: Property([255, 255, 255]),
    minimised: Property(false),
    selectedSlotId: Observ()
  })

  obs.overrideVolume = overrideVolume
  obs.params.context = context

  if (context.setup) {
    obs.selected = computed([obs.id, context.setup.selectedChunkId], function (id, selectedId) {
      return id === selectedId
    })
  }

  context.offset = obs.offset

  obs.output = context.output
  obs.context = context
  context.chunk = obs

  obs.volume(function (value) {
    output.gain.value = value
  })

  context.slotLookup = merge([
    lookup(obs.templateSlot.slots, 'id'),
    lookup(obs.slots, 'id')
  ])

  obs.triggerOn = function(id, at){
    var slot = context.slotLookup.get(id)

    if (obs.chokeAll()){
      obs.templateSlot.slots.forEach(function(slot){
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

  obs.resolved = withResolved(obs, ['triggers'])

  obs.grid = computed([obs.triggers, obs.shape], ArrayGrid)

  obs.resolvedGrid = computed([obs.triggers, obs.shape], function(triggers, shape){
    return ArrayGrid(triggers.map(getGlobalId), shape)
  })

  obs.destroy = function () {
    destroyAll(obs)
  }

  extendParams(obs)

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

function multiply (a, b) {
  return a * b
}
