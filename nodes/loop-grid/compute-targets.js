var computed = require('@mmckegg/mutant/computed')
var ArrayGrid = require('array-grid')
var DictToCollection = require('@mmckegg/mutant/dict-to-collection')
var Lookup = require('@mmckegg/mutant/lookup')

module.exports = function computeTargets (chunkLookup, positions, shape) {
  var chunkGrids = Lookup(DictToCollection(chunkLookup), function (pair) {
    return [pair.key, pair.value.resolvedGrid]
  })

  return computed([chunkGrids, positions, shape], function (chunkGrids, positions, shape) {
    var grid = ArrayGrid([], shape)
    if (chunkGrids && positions) {
      Object.keys(positions).forEach(function (id) {
        var origin = positions[id]
        if (chunkGrids[id] && Array.isArray(origin)) {
          grid.place(origin[0], origin[1], chunkGrids[id])
        }
      })
    }
    return grid.data
  })
}
