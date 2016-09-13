var ObservStruct = require('@mmckegg/mutant/struct')
var MutantArray = require('@mmckegg/mutant/array')
var Observ = require('@mmckegg/mutant/value')
var Property = require('lib/property')
var Slots = require('lib/slots')
var TemplateSlot = require('lib/template-slot')

var computed = require('@mmckegg/mutant/computed')
var lookup = require('@mmckegg/mutant/lookup')
var merge = require('@mmckegg/mutant/merge')

var Param = require('lib/param')
var destroyAll = require('lib/destroy-all')

module.exports = ChromaticChunk

function ChromaticChunk (parentContext) {
  var context = Object.create(parentContext)

  var defaultScale = {
    offset: 0,
    notes: [0, 2, 4, 5, 7, 9, 11]
  }

  var scale = Property(defaultScale)

  var computedScale = computed([scale, context.globalScale], function (scale, globalScale) {
    if (scale === '$global' && globalScale) {
      return globalScale
    } else if (scale instanceof Object) {
      return scale
    } else {
      return defaultScale
    }
  })

  var obs = ObservStruct({
    scale: scale,
    templateSlot: TemplateSlot(context, context.shape, computedScale),
    slots: Slots(context),
    inputs: Property([]),
    outputs: Property(['output']),
    params: MutantArray([]),
    selectedSlotId: Observ()
  })

  obs.slots.onAdd(function (slot) {
    slot.triggerOn(context.audio.currentTime)
  })

  context.chunk = obs
  obs.flags = context.flag
  obs.chokeAll = context.chokeAll
  obs.context = context

  obs.slotLookup = merge([
    lookup(obs.templateSlot.slots, 'id'),
    lookup(obs.slots, 'id')
  ])

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
