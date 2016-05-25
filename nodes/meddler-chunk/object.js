var NodeArray = require('observ-node-array')
var NodeVarhash = require('observ-node-array/varhash')
var lookup = require('observ-node-array/lookup')
var applyParams = require('lib/apply-params')
var BaseChunk = require('lib/base-chunk')
var Property = require('observ-default')
var ExternalRouter = require('lib/external-router')
var ChainScheduler = require('lib/chain-scheduler')
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

  var volume = Property(1)
  var overrideVolume = Property(1)

  var obs = BaseChunk(context, {
    slots: slots,
    inputs: Property(['input']),
    outputs: Property(['output']),
    routes: ExternalRouter(context, {output: '$default'}, computed([volume, overrideVolume], multiply)),
    params: Property([]),
    volume: volume,
    color: Property([255,255,0]),
    paramValues: NodeVarhash(parentContext),
    selectedSlotId: Property()
  })

  obs.overrideVolume = overrideVolume
  obs.params.context = context

  obs.resolved = Struct({
    slotLookup: context.slotLookup
  })

  var chainScheduler = ChainScheduler(context, 'input')
  extraSlots.put('input', chainScheduler)

  var lastTime = 0
  var currentChain = []
  var triggerOn = obs.triggerOn
  var triggerOff = obs.triggerOff

  obs.triggerOn = function (id, at) {
    at = Math.max(lastTime, at, context.audio.currentTime)
    lastTime = at

    currentChain = currentChain.filter(not, { value: id })
    currentChain.push(id)
    chainScheduler.schedule(currentChain, at)
    triggerOn(id, at)
  }

  obs.triggerOff = function (id, at) {
    at = Math.max(lastTime, at, context.audio.currentTime)
    lastTime = at

    currentChain = currentChain.filter(not, { value: id })
    chainScheduler.schedule(currentChain, at)
    triggerOff(id, at)
  }

  context.chunk = obs

  obs.output = context.output
  slots.onUpdate(obs.routes.reconnect)

  obs.destroy = function(){
    obs.routes.destroy()
  }

  applyParams(obs)

  return obs
}

function not (value) {
  return this.value !== value
}

function multiply (a, b) {
  return a * b
}
