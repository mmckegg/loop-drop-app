var computed = require('mutant/computed')
var ArrayGrid = require('array-grid')

module.exports = function computeFlags (obsChunkLookup, obsPositions, obsShape) {
  return computed([obsChunkLookup, obsPositions, obsShape], function (chunkLookup, positions, shape) {
    var grid = ArrayGrid([], shape)
    if (chunkLookup && positions) {
      Object.keys(positions).forEach(function (id) {
        var chunk = obsChunkLookup.get(id)
        var origin = positions[id]
        if (chunk && chunk.flags && chunk.flags() && chunk.grid) {
          var flags = chunk.flags()
          var chunkGrid = chunk.grid()

          var result = []
          if (Array.isArray(flags)) {
            if (flags.length) {
              chunkGrid.data.forEach(function (id, i) {
                result[i] = flags
              })
            }
          } else {
            chunkGrid.data.forEach(function (id, i) {
              if (flags[id]) {
                result[i] = flags[id]
              }
            })
          }

          grid.place(origin[0], origin[1], new ArrayGrid(result, chunkGrid.shape))
        }
      })
    }
    return grid
  })
}
