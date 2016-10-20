var RoutableSlot = require('lib/routable')
var Property = require('lib/property')

module.exports = function (context, id) {
  var input = context.audio.createGain()
  var output = context.audio.createGain()
  var connections = new Map()
  var lastEvent = null

  var releases = []
  var obs = RoutableSlot(context, {
    id: Property(id),
    output: Property('output')
  }, input, output, releases)

  obs.schedule = function (chain, at) {
    if (lastEvent) {
      lastEvent.routes.forEach((route) => {
        if (at > context.audio.currentTime) {
          route.gain.setValueAtTime(0, at)
        } else {
          route.disconnect()
        }
      })
      lastEvent.to = at
    }

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

    var routes = []
    connections.forEach(function (output, input) {
      var route = context.audio.createGain()
      input.connect(route)
      if (at > context.audio.currentTime) {
        route.gain.value = 0
        route.gain.setValueAtTime(1, at)
      }
      route.connect(output)
      routes.push(route)
    })

    lastEvent = {routes: routes, destroy: disconnectThis, to: null}
    context.cleaner.push(lastEvent)
  }

  obs.schedule([], 0)
  return obs
}

function disconnectThis () {
  this.routes.forEach(x => x.disconnect())
}
