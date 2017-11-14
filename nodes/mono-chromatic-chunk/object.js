var Struct = require('mutant/struct')
var KeyCollection = require('lib/key-collection')
var Observ = require('mutant/value')
var Property = require('lib/property')
var Slots = require('lib/slots')
var ParamSource = require('lib/param-source')
var TemplateSlot = require('lib/template-slot')
var ShapeSlots = require('lib/shape-slots')
var Param = require('lib/param')
var Sum = require('lib/param-sum')

var lookup = require('mutant/lookup')
var merge = require('mutant/merge')
var map = require('mutant/map')

var destroyAll = require('lib/destroy-all')

module.exports = MonoChromaticChunk

function MonoChromaticChunk (parentContext) {
  var context = Object.create(parentContext)

  var defaultScale = {
    offset: 0,
    notes: [0, 2, 4, 5, 7, 9, 11]
  }

  var currentValue = ParamSource(context, 0)
  context.scale = Property(defaultScale)
  context.offset = Sum([context.offset, currentValue])

  var Slot = context.nodes['slot']
  var templateSlot = TemplateSlot(context, [0, 0]) // don't generate any slots
  var triggerSlot = Slot(context)

  templateSlot(descriptor => {
    triggerSlot.set(obtainWithParams(descriptor, {
      id: 'trigger',
      value: 0,
      scale: '$inherit'
    }))
  })

  var lastTriggerOn = 0
  var lastTriggerOff = 0
  var valueStack = []
  var glide = Param(context, 0)

  var triggers = map(ShapeSlots(context.shape), value => {
    var slot = Struct({id: String(value)})
    slot.triggerOn = function (at) {
      if (lastTriggerOn <= lastTriggerOff) {
        lastTriggerOn = at
        triggerSlot.triggerOn(at)
      }
      setValue(value, at)
      var index = valueStack.indexOf(value)
      if (~index) { // move to top if already in stack
        valueStack.splice(index, 1)
      }
      valueStack.push(value)
    }
    slot.triggerOff = function (at) {
      var index = valueStack.indexOf(value)
      if (~index) {
        valueStack.splice(index, 1)
        if (index === valueStack.length && valueStack.length) {
          setValue(valueStack[valueStack.length - 1], at)
        }
        if (!valueStack.length) {
          lastTriggerOff = at
          triggerSlot.triggerOff(at)
        }
      }
    }
    return slot
  })

  var obs = Struct({
    scale: context.scale,
    templateSlot,
    glide,
    legato: Property(false),
    slots: Slots(context),
    inputs: Property([]),
    outputs: Property(['output']),
    params: KeyCollection(context),
    selectedSlotId: Observ()
  })

  obs.slots.onAdd(function (slot) {
    slot.triggerOn(context.audio.currentTime)
  })

  obs.glide.triggerOn(context.audio.currentTime)

  obs.params.context = context
  context.externalChunk = obs
  obs.flags = context.flag
  obs.paramValues = context.paramValues
  obs.context = context

  obs.slotLookup = merge([
    {trigger: triggerSlot},
    lookup(triggers, (x) => x && x['id']),
    lookup(obs.slots, (y) => y && y['id'])
  ])

  obs.spawnParam = function (id) {
    var key = context.fileObject.resolveAvailableParam(id || 'Param 1')
    obs.paramValues.put(key, 0)
    return obs.params.push(key)
  }

  obs.destroy = function () {
    triggerSlot.choke(context.audio.currentTime)
    destroyAll(obs)
  }

  return obs

  function setValue (value, at) {
    var glideDuration = Math.max(0, glide.getValueAtTime(at))
    currentValue.cancelAndHoldAtTime(at)
    var shouldSlide = obs.legato() ? !!valueStack.length : true
    if (glideDuration && shouldSlide) {
      currentValue.setValueAtTime(currentValue.getValueAtTime(at), at)
      currentValue.linearRampToValueAtTime(value, at + glideDuration)
    } else {
      currentValue.setValueAtTime(value, at)
    }
  }
}

function obtainWithParams (obj, params) {
  return JSON.parse(JSON.stringify(obj, function (k, v) {
    if (v && v.$param) {
      return params[v.$param]
    } else {
      return v
    }
  }))
}
