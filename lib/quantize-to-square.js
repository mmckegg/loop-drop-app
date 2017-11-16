module.exports = function quantizeToSquare (value) {
  if (value > 16) {
    return Math.floor(value / 16) * 16
  } else if (value > 8) {
    return Math.floor(value / 8) * 8
  } else if (value > 4) {
    return Math.floor(value / 4) * 4
  } else if (value > 2) {
    return Math.floor(value / 2) * 2
  } else if (value > 1) {
    return Math.floor(value / 1) * 1
  } else if (value > 0.5) {
    return Math.floor(value / 0.5) * 0.5
  } else {
    return value
  }
}
