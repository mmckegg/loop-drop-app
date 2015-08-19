var ObservStruct = require('observ-struct')
var Observ = require('observ')
var Property = require('observ-default')
var Event = require('geval')
var NodeArray = require('observ-node-array')
var ArrayGrid = require('array-grid')
var computed = require('observ/computed')
var lookup = require('observ-node-array/lookup')
var Transform = require('audio-slot-param/transform')

module.exports = ModulatorChunk

function ModulatorChunk(parentContext){

  var context = Object.create(parentContext)

  var obs = ObservStruct({
    id: Observ(),
    slots: NodeArray(context),
    minimised: Property(false),
    shape: Property([1,1]),
    color: Property([0,0,0]),
    flags: Property([])
  })

  obs._type = 'ModulatorChunk'

  obs.context = context
  context.chunk = obs

  context.slotLookup = lookup(obs.slots, 'id')

  var broadcastSchedule = null
  obs.onSchedule = Event(function(b){
    broadcastSchedule = b
  })

  var currentTransform = null

  obs.slots.onUpdate(function(){

    if (currentTransform){
      currentTransform.destroy()
      currentTransform = null
    }

    var transforms = [0]

    obs.slots.forEach(function(slot){
      if (slot.onSchedule){
        transforms.push({param: slot, transform: operation})
      }
    })

    currentTransform = Transform(context, transforms)
    currentTransform.onSchedule(broadcastSchedule)

  })

  obs.triggers = computed([obs.id, obs.shape], function(id, shape){
    var length = shape[0] * shape[1]
    var result = []
    for (var i=0;i<length;i++){
      result.push(String(i))
    }
    return result
  })

  obs.grid = computed([obs.triggers, obs.shape], ArrayGrid)

  obs.triggerOn = function(id, at){
    var slot = context.slotLookup.get(id)
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

  obs.destroy = function(){
    if (currentTransform){
      currentTransform.destroy()
      currentTransform = null
    }
  }

  obs.resolvedGrid = computed([obs.triggers, obs.shape], function(triggers, shape){
    return ArrayGrid(triggers.map(getGlobalId), shape)
  })

  return obs

  // scoped

  function operation(base, value){
    return (parseFloat(base)||0) + (parseFloat(value)||0)
  }

  function getGlobalId(id){
    if (id){
      return obs.id() + '/' + id
    }
  }

}