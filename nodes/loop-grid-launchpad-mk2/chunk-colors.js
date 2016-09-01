var computed = require('@mmckegg/mutant/computed')
var ArrayGrid = require('array-grid')
var Observ = require('@mmckegg/mutant/value')

module.exports = ChunkColors

function ChunkColors (chunkLookup, selected, targets, shape) {
  var highlighted = Observ()
  var timer = null

  highlighted.clear = function () {
    highlighted.set(null)
  }

  selected(function (id) {
    clearTimeout(timer)
    highlighted.set(id)
    timer = setTimeout(highlighted.clear, 400)
  })

  return computed([chunkLookup, targets, shape, highlighted], function computeMapGridValues (chunkLookup, targets, shape, highlighted) {
    var result = ArrayGrid([], shape)
    for (var r = 0; r < shape[0]; r++) {
      for (var c = 0; c < shape[1]; c++) {
        var id = getChunkId(targets[result.index(r, c)])
        var chunk = chunkLookup[id]
        if (chunk) {
          var color = saturate(notBlack(chunk.color, [5, 5, 5]), 2)
          if (highlighted === id) {
            color = normalize(color, 1)
          } else {
            color = normalize(color, 0.2)
          }
          result.set(r, c, color)
        }
      }
    }
    return result
  })
}

function getChunkId (id) {
  if (id && id.split) {
    return id.split('/')[0]
  }
}

function getLum (rgb) {
  return 0.2989 * rgb[0] + 0.5870 * rgb[1] + 0.1140 * rgb[2]
}
function multiply (rgb, value) {
  return [rgb[0] * value, rgb[1] * value, rgb[2] * value]
}

function normalize (rgb, value) {
  var multiplier = (255 - getLum(rgb)) / 256
  return multiply(rgb, multiplier * value)
}

function saturate (rgb, value) {
  var gray = getLum(rgb)
  return [
    clamp(-gray * (value - 1) + rgb[0] * value),
    clamp(-gray * (value - 1) + rgb[1] * value),
    clamp(-gray * (value - 1) + rgb[2] * value)
  ]
}

function clamp (value) {
  if (value > 255) return 255
  if (value < 0) return 0
  return value
}

function notBlack (color, fallback) {
  if (!color || (color[0] === 0 && color[1] === 0 && color[2] === 0)) {
    return fallback
  } else {
    return color
  }
}
