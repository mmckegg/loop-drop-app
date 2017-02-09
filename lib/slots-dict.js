var MutantMappedDict = require('mutant/mapped-dict')
var computed = require('mutant/computed')
var Event = require('geval')
var doubleBind = require('lib/double-bind')
var resolveNode = require('lib/resolve-node')
var watch = require('mutant/watch')

module.exports = SlotsDict

// TODO: find a way to share code with slots.js

function SlotsDict (context) {
  var itemReleases = new Map()

  var broadcastAdd = null
  var broadcastRemove = null

  var obs = MutantMappedDict([], function (key, item, invalidateOn) {
    var nodeName = computed(item, descriptor => descriptor && descriptor.node || false)
    invalidateOn(nodeName)
    var ctor = resolveNode(context.nodes, nodeName())
    if (ctor) {
      var instance = ctor(context)
      var releases = [ doubleBind(item, instance) ]
      if (instance.destroy) {
        releases.push(instance.destroy)
      }
      itemReleases.set(instance, releases)
      broadcastAdd(instance)
      return [key, instance]
    } else {
      return [key, item]
    }
  }, {
    onRemove: function (item) {
      if (item != null) {
        if (item.destroy) {
          item.destroy()
        }
        if (itemReleases.has(item)) {
          itemReleases.get(item).forEach(fn => fn())
          itemReleases.delete(item)
          broadcastRemove(item)
        }
      }
    }
  })

  var releaseSlots = watch(obs, function () {
    // hold slots open until destroy
  })

  obs.context = context
  obs.onAdd = Event(b => broadcastAdd = b)
  obs.onRemove = Event(b => broadcastRemove = b)

  obs.onNodeChange = Event(function (broadcast) {
    obs.onAdd(broadcast)
    obs.onRemove(broadcast)
  })

  obs.destroy = function () {
    Array.from(itemReleases.values()).forEach(function (releases) {
      releases.forEach(fn => fn())
    })
    itemReleases.clear()
    releaseSlots()
  }

  return obs
}
