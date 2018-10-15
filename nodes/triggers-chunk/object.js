var Slots = require('lib/slots')
var ObservStruct = require('mutant/struct')
var lookup = require('mutant/lookup')
var Property = require('lib/property')
var destroyAll = require('lib/destroy-all')
var resolve = require('mutant/resolve')
var KeyCollection = require('lib/key-collection')

module.exports = TriggersChunk

function TriggersChunk (parentContext) {
  var context = Object.create(parentContext)

  var obs = ObservStruct({
    slots: Slots(context),
    inputs: Property([]),
    outputs: Property([]),
    params: KeyCollection(context),
    midiOutputEnabled: Property(false),
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
  obs.paramValues = context.paramValues

  obs.spawnParam = function (id) {
    var key = context.fileObject.resolveAvailableParam(id || 'Param 1')
    obs.paramValues.put(key, 0)
    return obs.params.push(key)
  }

  obs.destroy = function () {
    destroyAll(obs)
  }

  return obs
}
