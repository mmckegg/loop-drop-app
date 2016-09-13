var Slots = require('lib/slots')
var ObservStruct = require('@mmckegg/mutant/struct')
var lookup = require('@mmckegg/mutant/lookup')
var Property = require('lib/property')
var destroyAll = require('lib/destroy-all')
var resolve = require('@mmckegg/mutant/resolve')

module.exports = TriggersChunk

function TriggersChunk (parentContext) {
  var context = Object.create(parentContext)

  var obs = ObservStruct({
    slots: Slots(context),
    inputs: Property([]),
    outputs: Property([]),
    params: Property([]),
    selectedSlotId: Property()
  })

  context.chunk = obs

  // HACK: allow triggered effects (such as LFOs and ring modulator) to work on non-triggerable slots
  obs.slots.onAdd(function (slot) {
    if (!isFinite(resolve(slot.id))) {
      slot.triggerOn(context.audio.currentTime)
    }
  })

  obs.activeSlots = context.activeSlots
  obs.context = context
  obs.shape = context.shape
  obs.flags = context.flags
  obs.chokeAll = context.chokeAl
  obs.slotLookup = lookup(obs.slots, 'id')

  obs.destroy = function () {
    destroyAll(obs)
  }

  return obs
}
