var Value = require('mutant/value')
var MutantMap = require('mutant/map')
var watch = require('mutant/watch')
var computed = require('mutant/computed')
var doubleBind = require('lib/double-bind')
var resolveNode = require('lib/resolve-node')
var throttle = require('mutant/throttle')
var ShapeSlots = require('lib/shape-slots')
var Event = require('geval')

module.exports = TemplateSlot

function TemplateSlot (context, shape) {
  var obs = Value({})

  // handle defaultValue
  var set = obs.set
  obs.set = function (v) {
    set(v == null ? {} : v)
  }

  var templateContext = Object.create(context)
  templateContext.template = true

  obs.context = context
  obs.node = null

  var releases = []
  var itemReleases = new Map()
  var broadcastAdd = null
  var broadcastRemove = null

  obs.nodeName = computed([obs], x => (x && x.node) || false)

  var ids = ShapeSlots(shape)
  var throttledValue = throttle(obs, 40)

  obs.slots = MutantMap(ids, function (id, invalidateOn) {
    var ctor = resolveNode(context.nodes, obs.nodeName())
    invalidateOn(obs.nodeName)

    if (ctor) {
      var result = ctor(context)
      var value = computed([obs, {
        id: String(id),
        value: id,
        scale: '$inherit'
      }], obtainWithParams)
      var releases = [ watch(value, result.set) ]
      if (result.destroy) {
        releases.push(result.destroy)
      }
      itemReleases.set(result, releases)
      broadcastAdd(result)
      return result
    }
  }, {
    maxTime: 5,
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

  obs.slots.onAdd = Event(b => { broadcastAdd = b })
  obs.slots.onRemove = Event(b => { broadcastRemove = b })

  obs.slots.onNodeChange = Event(function (broadcast) {
    obs.slots.onAdd(broadcast)
    obs.slots.onRemove(broadcast)
  })

  var releaseSlots = watch(obs.slots, function () {
    // hold slots open until destroy
  })

  watch(obs.nodeName, function (nodeName) {
    var ctor = resolveNode(context.nodes, nodeName)

    // clean up last
    obs.node = null
    while (releases.length) {
      releases.pop()()
    }

    if (ctor) {
      var instance = ctor(templateContext)
      releases.push(doubleBind(obs, instance, {idle: false}))

      if (instance.destroy) {
        releases.push(instance.destroy)
      }

      obs.node = instance
    }
  })

  obs.destroy = function () {
    releaseSlots()
    while (releases.length) {
      releases.pop()()
    }
    Array.from(itemReleases.values()).forEach(function (releases) {
      releases.forEach(fn => fn())
    })
    itemReleases.clear()
  }

  return obs
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
