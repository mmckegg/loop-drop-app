module.exports = function clamp (value, min, max) {
  if (typeof value !== 'number') return min
  return Math.min(max, Math.max(min, value))
}
