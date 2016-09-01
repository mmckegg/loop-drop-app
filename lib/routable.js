var Observ = require('@mmckegg/mutant/value')
var ObservStruct = require('@mmckegg/mutant/struct')

var Property = require('observ-default')
var extend = require('xtend')

module.exports = RoutableSlot

function RoutableSlot (context, properties, input, output, releases) {
  var audioContext = context.audio

  output = output || input

  var refreshingConnections = false
  var connections = []
  var extraConnections = []

  var obs = ObservStruct(extend({
    id: Observ(),
    output: Observ(),
    volume: Property(1)
  }, properties))

  obs._type = 'RoutableSlot'
  obs.context = context
  obs.volume(function (value) {
    output.gain.value = value
  })

  obs.input = input

  // main output
  obs.output(queueRefreshConnections)

  var removeSlotWatcher = context.slotLookup && context.slotLookup(queueRefreshConnections)

  obs.connect = function (destination) {
    output.connect(destination)
    extraConnections.push(destination)
  }

  obs.disconnect = function (destination) {
    if (destination) {
      remove(extraConnections, destination)
      output.disconnect(destination)
    } else {
      while (extraConnections.length) {
        output.disconnect(extraConnections.pop())
      }
    }
  }

  obs.destroy = function () {
    Object.keys(obs).forEach(function (key) {
      if (obs[key] && typeof obs[key].destroy === 'function') {
        obs[key].destroy()
      }
    })
    removeSlotWatcher && removeSlotWatcher()
    removeSlotWatcher = null
  }

  queueRefreshConnections()

  return obs

  // scoped

  function queueRefreshConnections () {
    if (!refreshingConnections) {
      refreshingConnections = true
      setImmediate(refreshConnections)
    }
  }

  function refreshConnections () {
    var outputs = []
    refreshingConnections = false
    var outputNames = typeof obs.output() === 'string' ? [obs.output()] : obs.output()

    if (Array.isArray(outputNames)) {
      outputNames.forEach(function (name) {
        var destinationSlot = context.slotLookup.get(name)
        if (destinationSlot && destinationSlot.input) {
          outputs.push(destinationSlot.input)
        }
      })
    }

    connections.forEach(function (node) {
      if (!~outputs.indexOf(node)) {
        output.disconnect(node)
      }
    })

    outputs.forEach(function (node) {
      if (!~connections.indexOf(node)) {
        output.connect(node)
      }
    })

    connections = outputs
  }
}

function remove (array, item) {
  var index = array.indexOf(item)
  if (~index) {
    array.splice(index, 1)
  }
}
