var RoutableSlot = require('audio-slot/routable')
var Property = require('observ-default')

module.exports = function (context, id) {

  var input = context.audio.createGain()
  var output = context.audio.createGain()
  var lastRoutes = []
  var discarded = []
  var connections = new Map()

  var obs = RoutableSlot(context, {
    id: Property(id),
    output: Property('output')
  }, input, output)

  obs.schedule = function (chain, at) {
    clearDiscarded()
    lastRoutes.forEach(function (route) {
      route.gain.setValueAtTime(0, at)
    })
    discarded.push([at, lastRoutes])

    var last = input

    for (var i = 0; i <= chain.length; i++) {
      if (i < chain.length) {
        var id = chain[i]
        var slot = context.slotLookup.get(id)
        connections.set(last, slot.input)
        last = slot
      } else {
        connections.set(last, output)
      }
    }

    lastRoutes = []
    connections.forEach(function (output, input) {
      var route = context.audio.createGain()
      route.gain.value = 0
      input.connect(route)
      route.gain.setValueAtTime(1, at)
      route.connect(output)
      lastRoutes.push(route)
    })
  }

  obs.schedule([], 0)
  return obs

  function clearDiscarded () {
    var before = context.audio.currentTime
    for (var i = discarded.length - 1; i >= 0; i--) {
      var time = discarded[i][0]
      var routes = discarded[i][1]

      if (time + 5 < before) {
        routes.forEach(disconnect)
        discarded.splice(i, 1)
      }
    }
  }
}

function disconnect (item) {
  item.disconnect()
}
