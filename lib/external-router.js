var Dict = require('mutant/dict')
var watch = require('mutant/watch')
var resolve = require('mutant/resolve')
var toCollection = require('mutant/dict-to-collection')
var MutantMap = require('mutant/map')

module.exports = ExternalRouter

function ExternalRouter (context, defaultValue, volume) {
  var obs = Dict()
  var releases = []
  obs.context = context

  var refreshing = false
  var destroyed = false

  var connections = new Map()
  var gains = new Map()

  var set = obs.set
  obs.set = function (v) {
    set(v == null ? defaultValue : v)
  }

  if (typeof volume === 'function') {
    volume(function (value) {
      gains.forEach(function (item) {
        item.gain.value = value
      })
    })
  }

  obs.refresh = function () {
    if (!refreshing) {
      refreshing = true
      setImmediate(refresh)
    }
  }

  releases.push(obs(obs.refresh))

  var destinationIds = MutantMap(toCollection(context.chunkLookup), (item, invalidateOn) => {
    if (item.value) {
      if (item.value.loaded) {
        invalidateOn(item.value.loaded)
      }
      return item.value.id
    }
  })

  if (context.chunkLookup) {
    releases.push(watch(destinationIds, obs.refresh))
  }

  obs.destroy = function () {
    destroyed = true
    Array.from(gains.keys()).forEach(function (key) {
      gains.get(key).disconnect()
      gains.delete(key)
    })

    while (releases.length) {
      releases.pop()()
    }
  }

  return obs

  // scoped

  function refresh () {
    if (destroyed) return false
    refreshing = false
    var usedGains = []
    var routes = obs() || {}
    Object.keys(routes).forEach(function (from) {
      var target = routes[from]
      var source = context.slotLookup.get(from)

      if (typeof target === 'string') {
        target = [target]
      }

      if (source && Array.isArray(target)) {
        if (!gains.has(source)) {
          var node = context.audio.createGain()
          gains.set(source, node)
          node.gain.value = typeof resolve(volume) === 'number' ? resolve(volume) : 1
          source.connect(node)
        }

        usedGains.push(gains.get(source))

        if (!connections.has(source)) {
          connections.set(source, [])
        }

        var destinations = target.map(function (to) {
          if (to && typeof to === 'string') {
            if (to === '$default') {
              return context.output
            } else {
              to = to.split('#')
              var destinationChunk = context.chunkLookup.get(to[0])
              var destinationSlot = destinationChunk && destinationChunk.getSlot(to[1])
              if (destinationSlot && destinationSlot.input) {
                return destinationSlot.input
              }
            }
          }
        }).filter(present)

        destinations.forEach(function (output) {
          if (!connections.get(source).includes(output)) {
            gains.get(source).connect(output)
            connections.get(source).push(output)
          }
        })

        connections.set(source, connections.get(source).filter(function (output) {
          if (!destinations.includes(output)) {
            gains.get(source).disconnect(output)
            return false
          } else {
            return true
          }
        }))
      }
    })

    // remove old unused routes
    Array.from(gains.keys()).forEach(function (key) {
      if (!usedGains.includes(gains.get(key))) {
        gains.get(key).disconnect()
        gains.delete(key)
      }
    })
  }
}

function present (value) {
  return value
}
