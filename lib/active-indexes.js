var computed = require('@mmckegg/mutant/computed')

module.exports = function activeIndexes (obs) {
  return computed([obs], function (grid) {
    var result = []
    grid.data.forEach(pushIndexIfPresent, result)
    return result
  })
}

function pushIndexIfPresent (value, index) {
  if (value) {
    this.push(index)
  }
}