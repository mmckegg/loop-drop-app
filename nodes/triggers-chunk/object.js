var Slots = require('lib/slots')
var ObservStruct = require('@mmckegg/mutant/struct')
var lookup = require('@mmckegg/mutant/lookup')
var Property = require('lib/property')
var destroyAll = require('lib/destroy-all')
var resolve = require('@mmckegg/mutant/resolve')
var MutantArray = require('@mmckegg/mutant/array')

module.exports = TriggersChunk

function TriggersChunk (parentContext) {
  var context = Object.create(parentContext)

  var obs = ObservStruct({
    slots: Slots(context),
    inputs: Property([]),
    outputs: Property([]),
    params: MutantArray([]),
    selectedSlotId: Property()
  })

  context.externalChunk = obs

  // HACK: allow triggered effects (such as LFOs and ring modulator) to work on non-triggerable slots
  obs.slots.onAdd(function (slot) {
    if (!isFinite(resolve(slot.id))) {
      slot.triggerOn(context.audio.currentTime)
    }
  })

  obs.params.context = context
  obs.activeSlots = context.activeSlots
  obs.context = context
  obs.shape = context.shape
  obs.flags = context.flags
  obs.chokeAll = context.chokeAll
  obs.slotLookup = lookup(obs.slots, 'id')

  obs.spawnParam = function (id) {
    var key = context.fileObject.resolveAvailableParam(id || 'New Param')
    obs.params.push(key)
    return key
  }

  obs.destroy = function () {
    destroyAll(obs)
  }

  return obs
}
