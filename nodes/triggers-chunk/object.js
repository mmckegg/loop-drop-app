var NodeArray = require('observ-node-array')
var NodeVarhash = require('observ-node-array/varhash')
var lookup = require('observ-node-array/lookup')
var applyParams = require('lib/apply-params')
var BaseChunk = require('lib/base-chunk')
var Property = require('observ-default')
var ExternalRouter = require('lib/external-router')

module.exports = TriggersChunk

function TriggersChunk (parentContext) {
  var context = Object.create(parentContext)
  var output = context.output = context.audio.createGain()
  context.output.connect(parentContext.output)

  var slots = NodeArray(context)
  context.slotLookup = lookup(slots, 'id')

  var obs = BaseChunk(context, {
    slots: slots,
    inputs: Property([]),
    outputs: Property([]),
    routes: ExternalRouter(context, {output: '$default'}),
    params: Property([]),
    volume: Property(1),
    paramValues: NodeVarhash(parentContext),
    selectedSlotId: Property()
  })

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
