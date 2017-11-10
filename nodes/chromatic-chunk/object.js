var ObservStruct = require('mutant/struct')
var MutantArray = require('mutant/array')
var Observ = require('mutant/value')
var Property = require('lib/property')
var Slots = require('lib/slots')
var TemplateSlot = require('lib/template-slot')
var datShare = require('lib/dat-share')

var lookup = require('mutant/lookup')
var merge = require('mutant/merge')

var destroyAll = require('lib/destroy-all')

module.exports = ChromaticChunk

function ChromaticChunk (parentContext) {
  var context = Object.create(parentContext)

  var defaultScale = {
    offset: 0,
    notes: [0, 2, 4, 5, 7, 9, 11]
  }

  context.scale = Property(defaultScale)

  var obs = ObservStruct({
    scale: context.scale,
    templateSlot: TemplateSlot(context, context.shape),
    slots: Slots(context),
    inputs: Property([]),
    outputs: Property(['output']),
    params: MutantArray([]),
    selectedSlotId: Observ(),
    publish: Property(),
    publishedName: Property(),
    publishedTags: Property(),
    publishedShape: Property(),
    publishedUrl: Property()
  })

  obs.publish(value => {
    if (!value) return
    obs.publishedShape.set(parentContext.shape().join(','))
    var fullPath = parentContext.fileObject.resolvePath('.')
    datShare(fullPath, function (err, details) {
      if (err) return console.log(err)
      obs.publishedUrl.set(details.link)
    })
  })

  obs.slots.onAdd(function (slot) {
    slot.triggerOn(context.audio.currentTime)
  })

  obs.params.context = context
  context.externalChunk = obs
  obs.flags = context.flag
  obs.chokeAll = context.chokeAll
  obs.context = context

  obs.slotLookup = merge([
    lookup(obs.templateSlot.slots, (x) => x && x['id']),
    lookup(obs.slots, (y) => y && y['id'])
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
