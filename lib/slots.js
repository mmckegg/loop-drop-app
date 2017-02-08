var MutantMappedArray = require('@mmckegg/mutant/mapped-array')
var doubleBind = require('lib/double-bind')
var computed = require('@mmckegg/mutant/computed')
var Event = require('geval')
var resolveNode = require('lib/resolve-node')
var watch = require('@mmckegg/mutant/watch')

module.exports = Slots

function Slots (parentContext) {
  var context = Object.create(parentContext)
  var itemReleases = new Map()

  var broadcastAdd = null
  var broadcastRemove = null

  var obs = MutantMappedArray([], function (item, invalidateOn) {
    var nodeName = computed(item, descriptor => descriptor && descriptor.node || false)
    invalidateOn(nodeName)
    var ctor = resolveNode(context.nodes, nodeName())

    if (ctor) {
      var slotContext = Object.create(context)
      var result = ctor(slotContext)
      slotContext.node = result
      var releases = [ doubleBind(item, result) ]
      if (result.destroy) {
        releases.push(result.destroy)
      }
      itemReleases.set(result, releases)
      broadcastAdd(result)
      return result
    }
  }, {
    onRemove: function (instance) {
      if (instance != null) {
        if (instance.destroy) {
          instance.destroy()
        }
        if (itemReleases.has(instance)) {
          itemReleases.get(instance).forEach(fn => fn())
          itemReleases.delete(instance)
          broadcastRemove(instance)
        }
      }
    }
  })

  var releaseSlots = watch(obs, function () {
    // hold slots open until destroy
  })

  context.collection = obs

  obs.onAdd = Event(b => broadcastAdd = b)
  obs.onRemove = Event(b => broadcastRemove = b)
  obs.onNodeChange = Event(function (broadcast) {
    obs.onAdd(broadcast)
    obs.onRemove(broadcast)
  })

  obs.context = context

  obs.destroy = function () {
    Array.from(itemReleases.values()).forEach(function (releases) {
      releases.forEach(fn => fn())
    })
    itemReleases.clear()
    releaseSlots()
  }

  return obs
}
