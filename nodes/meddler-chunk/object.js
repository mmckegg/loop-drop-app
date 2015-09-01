var NodeArray = require('observ-node-array')
var NodeVarhash = require('observ-node-array/varhash')
var lookup = require('observ-node-array/lookup')
var applyParams = require('lib/apply-params')
var BaseChunk = require('lib/base-chunk')
var Property = require('observ-default')
var ExternalRouter = require('lib/external-router')
var RoutableSlot = require('audio-slot/routable')
var Meddler = require('audio-meddle')
var Varhash = require('observ-varhash')
var Struct = require('observ-struct')
var lookup =  require('observ-node-array/lookup')
var merge =  require('observ-node-array/merge')

module.exports = MeddlerChunk

function MeddlerChunk (parentContext) {
  var context = Object.create(parentContext)
  var output = context.output = context.audio.createGain()
  context.output.connect(parentContext.output)
  context.slotProcessorsOnly = true

  var slots = NodeArray(context)
  var extraSlots = Varhash({})

  context.slotLookup = merge([ 
    lookup(slots, 'id'),
    extraSlots
  ])

  var obs = BaseChunk(context, {
    slots: slots,
    inputs: Property(['input']),
    outputs: Property(['output']),
    routes: ExternalRouter(context, {output: '$default'}),
    params: Property([]),
    volume: Property(1),
    paramValues: NodeVarhash(parentContext),
    selectedSlotId: Property()
  })

  var meddler = Meddler(context.audio)
  extraSlots.put('input', RoutableSlot(context, {
    id: Property('input'),
    output: Property('output')
  }, meddler))

  slots(function () {
    slots.forEach(function (slot) {
      if (isFinite(slot.id())) {
        meddler.add(slot.id(), slot)
      }
    })
  })

  var triggerOn = obs.triggerOn
  var triggerOff = obs.triggerOff

  obs.triggerOn = function (id, at) {
    meddler.start(id, at)
    triggerOn(id, at)
  }

  obs.triggerOff = function (id, at) {
    meddler.stop(id, at)
    triggerOff(id, at)
  }

  obs.volume(function(value){
    output.gain.value = value
  })

  context.chunk = obs

  obs.output = context.output
  slots.onUpdate(obs.routes.reconnect)

  obs.destroy = function(){
    obs.routes.destroy()
  }

  applyParams(obs)

  return obs
}