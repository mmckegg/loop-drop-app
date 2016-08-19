var Property = require('observ-default')
var Event = require('geval')
var NodeArray = require('observ-node-array')
var lookup = require('observ-node-array/lookup')
var Transform = require('audio-slot-param/transform')
var BaseChunk = require('lib/base-chunk')
var destroyAll = require('lib/destroy-all')

module.exports = ModulatorChunk

function ModulatorChunk (parentContext) {
  var context = Object.create(parentContext)
  var slots = NodeArray(context)
  context.slotLookup = lookup(slots, 'id')

  var obs = BaseChunk(context, {
    slots: slots,
    color: Property([0, 0, 0])
  })

  obs._type = 'ModulatorChunk'

  obs.context = context
  context.chunk = obs

  var broadcastSchedule = null
  obs.onSchedule = Event(function (b) {
    broadcastSchedule = b
  })

  var currentTransform = null

  obs.slots.onUpdate(function () {
    if (currentTransform) {
      currentTransform.destroy()
      currentTransform = null
    }

    var transforms = [0]

    obs.slots.forEach(function (slot) {
      if (slot.onSchedule) {
        transforms.push({param: slot, transform: operation})
      }
    })

    currentTransform = Transform(context, transforms)
    currentTransform.onSchedule(broadcastSchedule)
  })

  obs.destroy = function () {
    destroyAll(obs)
    if (currentTransform) {
      currentTransform.destroy()
      currentTransform = null
    }
  }

  return obs

  // scoped

  function operation (base, value) {
    return (parseFloat(base) || 0) + (parseFloat(value) || 0)
  }
}
