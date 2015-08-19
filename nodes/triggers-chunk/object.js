var ObservStruct = require('observ-struct')
var Observ = require('observ')
var Property = require('observ-default')
var ObservVarhash = require('observ-varhash')
var NodeArray = require('observ-node-array')
var NodeVarhash = require('observ-node-array/varhash')
var ArrayGrid = require('array-grid')
var computed = require('observ/computed')
var lookup = require('observ-node-array/lookup')
var nextTick = require('next-tick')
var deepEqual = require('deep-equal')
var ExternalRouter = require('lib/external-router')
var applyParams = require('lib/apply-params')

module.exports = TriggersChunk

function TriggersChunk (parentContext) {

  var context = Object.create(parentContext)
  var output = context.output = context.audio.createGain()
  context.output.connect(parentContext.output)

  var obs = ObservStruct({
    id: Observ(),
    shape: Property([1,1]),
    slots: NodeArray(context),
    inputs: Property([]),
    outputs: Property([]),
    params: Property([]),
    paramValues: NodeVarhash(parentContext),
    routes: ExternalRouter(context),
    flags: Property([]),
    volume: Property(1),
    chokeAll: Property(false),
    color: Property([255,255,255]),
    selectedSlotId: Observ()
  })

  obs.output = context.output
  obs.context = context

  obs.volume(function(value){
    output.gain.value = value
  })

  context.slotLookup = lookup(obs.slots, 'id')
  context.chunk = obs

  obs.triggerOn = function(id, at){
    var slot = context.slotLookup.get(id)

    if (obs.chokeAll()){
      obs.slots.forEach(function(slot){
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

  obs.triggers = computed([obs.id, obs.shape, context.slotLookup], function(id, shape){
    var length = shape[0] * shape[1]
    var result = []
    for (var i=0;i<length;i++){
      if (obs.getSlot(String(i))) {
        result.push(String(i))
      } else {
        result.push(null)
      }
    }
    return result
  })

  obs.grid = computed([obs.triggers, obs.shape], ArrayGrid)

  obs.resolvedGrid = computed([obs.triggers, obs.shape], function(triggers, shape){
    return ArrayGrid(triggers.map(getGlobalId), shape)
  })


  obs.slots.onUpdate(obs.routes.reconnect)

  obs.destroy = function(){
    obs.routes.destroy()
  }

  applyParams(obs)

  return obs

  // scoped

  function getGlobalId(id){
    if (id){
      return obs.id() + '/' + id
    }
  }
}