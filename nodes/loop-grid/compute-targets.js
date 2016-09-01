var computed = require('@mmckegg/mutant/computed')
var ArrayGrid = require('array-grid')

module.exports = function computeTargets (obsChunkLookup, obsPositions, obsShape) {
  return computed([obsChunkLookup, obsPositions, obsShape], function (chunkLookup, positions, shape) {
    var grid = ArrayGrid([], shape)
    if (chunkLookup && positions) {
      Object.keys(positions).forEach(function (id) {
        var chunk = obsChunkLookup.get(id)
        var origin = positions[id]
        var chunkGrid = chunk && chunk.resolvedGrid && chunk.resolvedGrid()
        if (chunkGrid && Array.isArray(origin)) {
          grid.place(origin[0], origin[1], chunkGrid)
        }
      })
    }
    return grid.data
  })
}
