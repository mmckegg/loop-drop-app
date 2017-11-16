module.exports = quantizeDuration

function quantizeDuration (value) {
  var grid = getGrid(value)
  return Math.round(value / grid) * grid
}

function getGrid (duration) {
  if (duration < 0.7) {
    return 0.5
  } else if (duration < 1.7) {
    return 1
  } else {
    return 2
  }
}
