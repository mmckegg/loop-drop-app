var Slots = require('lib/slots')
var lookup = require('@mmckegg/mutant/lookup')
var Struct = require('@mmckegg/mutant/struct')
var Property = require('lib/property')
var ChainScheduler = require('lib/chain-scheduler')
var Dict = require('@mmckegg/mutant/dict')
var merge = require('@mmckegg/mutant/merge')
var destroyAll = require('lib/destroy-all')
var resolve = require('@mmckegg/mutant/resolve')

module.exports = MeddlerChunk

function MeddlerChunk (parentContext) {
  var context = Object.create(parentContext)
  context.slotProcessorsOnly = true

  var obs = Struct({
    slots: Slots(context),
    inputs: Property(['input']),
    outputs: Property(['output']),
    params: Property([]),
    selectedSlotId: Property()
  })

  var extraSlots = Dict({})
  obs.slotLookup = merge([
    lookup(obs.slots, 'id'),
    extraSlots
  ])

  obs.context = context
  obs.shape = context.shape
  obs.activeSlots = context.activeSlots

  // HACK: allow triggered effects (such as LFOs and ring modulator) to work on non-triggerable slots
  obs.slots.onAdd(function (slot) {
    if (!isFinite(resolve(slot.id))) {
      slot.triggerOn(context.audio.currentTime)
    }
  })

  var chainScheduler = ChainScheduler(context, 'input')
  extraSlots.put('input', chainScheduler)

  var lastTime = 0
  var currentChain = []

  obs.triggerOn = function (id, at) {
    at = Math.max(lastTime, at, context.audio.currentTime)
    lastTime = at

    currentChain = currentChain.filter(not, { value: id })
    currentChain.push(id)
    chainScheduler.schedule(currentChain, at)
  }

  obs.triggerOff = function (id, at) {
    at = Math.max(lastTime, at, context.audio.currentTime)
    lastTime = at

    currentChain = currentChain.filter(not, { value: id })
    chainScheduler.schedule(currentChain, at)
  }

  context.chunk = obs

  obs.destroy = function () {
    destroyAll(obs)
  }

  return obs
}

function not (value) {
  return this.value !== value
}
