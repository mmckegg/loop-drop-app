var Slots = require('lib/slots')
var lookup = require('mutant/lookup')
var Struct = require('mutant/struct')
var Property = require('lib/property')
var ChainScheduler = require('lib/chain-scheduler')
var Dict = require('mutant/dict')
var merge = require('mutant/merge')
var destroyAll = require('lib/destroy-all')
var resolve = require('mutant/resolve')
var MutantArray = require('mutant/array')
var destroySourceNode = require('lib/destroy-source-node')

module.exports = MeddlerChunk

function MeddlerChunk (parentContext) {
  var context = Object.create(parentContext)
  context.slotProcessorsOnly = true

  var signal = context.audio.createConstantSource()
  signal.offset.value = 0
  signal.start()

  var obs = Struct({
    slots: Slots(context),
    inputs: Property(['input']),
    outputs: Property(['output']),
    params: MutantArray([]),
    selectedSlotId: Property()
  })

  var extraSlots = Dict({})
  obs.slotLookup = merge([
    lookup(obs.slots, 'id'),
    extraSlots
  ])

  obs.params.context = context
  obs.context = context
  obs.shape = context.shape
  obs.flags = context.flags
  obs.chokeAll = context.chokeAll
  obs.activeSlots = context.activeSlots
  obs.paramValues = context.paramValues

  // HACK: allow triggered effects (such as LFOs and ring modulator) to work on non-triggerable slots
  obs.slots.onAdd(function (slot) {
    if (!isFinite(resolve(slot.id))) {
      slot.triggerOn(context.audio.currentTime)
    }
  })

  var chainScheduler = ChainScheduler(context, 'input')
  signal.connect(chainScheduler.input)
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

  context.externalChunk = obs

  obs.spawnParam = function (id) {
    var key = context.fileObject.resolveAvailableParam(id || 'New Param')
    obs.params.push(key)
    obs.paramValues.put(key, 0)
    return key
  }

  obs.destroy = function () {
    destroyAll(obs)
    destroySourceNode(signal)
  }

  return obs
}

function not (value) {
  return this.value !== value
}
