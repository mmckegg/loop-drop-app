var ArrayGrid = require('array-grid')

module.exports = function (grid) {

  var routing = {}
  var layers = []

  watchGridChanges(grid, function (changes) {
    var currentValue = grid()
    var update = {}
    for (var i = 0; i < changes.length; i++) {
      var change = changes[i]
      var index = currentValue.index(change[0], change[1])
      var value = change[2]

      var lastLayerIndex = layers.indexOf(routing[index])
      var currentLayerIndex = getLayerFor(index)

      // update last layer
      if (~lastLayerIndex) {
        if (!update[lastLayerIndex]) {
          update[lastLayerIndex] = layers[lastLayerIndex].values.slice()
        }
        update[lastLayerIndex][index] = null
      }

      // update current layer
      if (value && ~currentLayerIndex) {
        if (!update[currentLayerIndex]) {
          update[currentLayerIndex] = layers[currentLayerIndex].values.slice()
        }
        update[currentLayerIndex][index] = value
        routing[index] = layers[currentLayerIndex]
      }
    }

    Object.keys(update).forEach(broadcast, {
      updates: update,
      layers: layers,
      shape: currentValue.shape
    })

  })

  function grab (listener, opts) {
    var shape = grid().shape

    if (arguments.length === 0) {
      // make it work with watch
      return ArrayGrid([], shape)
    }

    var layer = {
      listener: listener,
      values: [],
      exclude: opts && opts.exclude
    }

    layers.push(layer)

    return function () {
      var index = layers.indexOf(layer)
      if (~index) {
        layers.splice(index, 1)
      }
    }
  }

  return grab

  // scoped

  function getLayerFor (index) {
    for (var i = layers.length - 1; i >= 0; i--) {
      var exclude = resolve(layers[i].exclude)
      if (!exclude || !~exclude.indexOf(index)) {
        return i
      }
    }
    return -1
  }
}

function resolve (val) {
  return typeof val === 'function' ? val() : val
}

function broadcast (key) {
  var newData = this.updates[key]
  var layer = this.layers[key]
  var shape = this.shape
  layer.values = newData
  layer.listener(ArrayGrid(newData, shape))
}

function watchGridChanges(grid, handler) {
  var lastData = grid() && grid().data || []
  var remove = grid(function(value){
    var length = value.shape[0] * value.shape[1]
    var changes = []
    for (var i=0; i<length; i++) {
      if (value.data[i] !== lastData[i]){
        var coords = value.coordsAt(i)
        changes.push([coords[0], coords[1], value.data[i]])
      }
    }
    lastData = value.data
    handler(changes)
  })
  return remove
}
