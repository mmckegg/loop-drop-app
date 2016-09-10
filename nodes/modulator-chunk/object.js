var Property = require('lib/property')
var Slots = require('lib/slots')
var lookup = require('@mmckegg/mutant/lookup')
var ParamSum = require('lib/param-sum')
var BaseChunk = require('lib/base-chunk')
var destroyAll = require('lib/destroy-all')
var computed = require('@mmckegg/mutant/computed')
var createVoltage = require('lib/create-voltage')

module.exports = ModulatorChunk

function ModulatorChunk (parentContext) {
  var context = Object.create(parentContext)
  var slots = Slots(context)
  context.slotLookup = lookup(slots, 'id')

  var obs = BaseChunk(context, {
    slots: slots,
    color: Property([0, 0, 0])
  })

  var voltage = createVoltage(context.audio, 0)
  voltage.start()

  obs._type = 'ModulatorChunk'
  obs.context = context

  obs.currentValue = computed([obs.slots], function () {
    var params = [voltage]
    obs.slots.forEach(function (slot) {
      if (slot && slot.currentValue) {
        params.push(slot)
      }
    })
    return ParamSum(params)
  })

  obs.destroy = function () {
    destroyAll(obs)
    voltage.stop()
  }

  return obs
}
