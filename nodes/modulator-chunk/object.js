var Property = require('lib/property')
var Slots = require('lib/slots')
var lookup = require('@mmckegg/mutant/lookup')
var ParamSum = require('lib/param-sum')
var BaseChunk = require('lib/base-chunk')
var destroyAll = require('lib/destroy-all')
var MutantMap = require('@mmckegg/mutant/map')

module.exports = ModulatorChunk

function ModulatorChunk (parentContext) {
  var context = Object.create(parentContext)
  var slots = Slots(context)
  context.slotLookup = lookup(slots, 'id')

  var obs = BaseChunk(context, {
    slots: slots,
    color: Property([0, 0, 0])
  })

  obs._type = 'ModulatorChunk'
  obs.context = context
  context.chunk = obs

  // TODO: ParamSum should just be able to accept obs.slots directly

  var values = MutantMap(obs.slots, function (slot) {
    return slot.currentValue
  })

  obs.currentValue = ParamSum(values)

  obs.destroy = function () {
    destroyAll(obs)
  }

  return obs
}
