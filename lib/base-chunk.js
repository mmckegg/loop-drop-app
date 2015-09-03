var ObservStruct = require('observ-struct')
var Observ = require('observ')
var Property = require('observ-default')
var ObservVarhash = require('observ-varhash')
var NodeArray = require('observ-node-array')
var ArrayGrid = require('array-grid')
var computed = require('observ/computed')
var nextTick = require('next-tick')
var deepEqual = require('deep-equal')
var extend = require('xtend/mutable')

module.exports = BaseChunk

function BaseChunk (context, extraProperties) {

  var obs = ObservStruct(extend({
    id: Observ(),
    shape: Property([1,4]),
    flags: Property([]),
    chokeAll: Property(false),
    color: Property([255,255,255])
  }, extraProperties))

  obs.context = context

  obs.triggerOn = function(id, at){
    var slot = context.slotLookup.get(id)
    var shape = obs.shape()
    var length = shape[0] * shape[1]

    if (obs.chokeAll()){
      for (var i = 0; i < length; i++) {
        var otherSlot = context.slotLookup.get(String(i))
        if (otherSlot) {
          otherSlot.choke(at)
        }
      }
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

  return obs

  // scoped

  function getGlobalId(id){
    if (id){
      return obs.id() + '/' + id
    }
  }
}
