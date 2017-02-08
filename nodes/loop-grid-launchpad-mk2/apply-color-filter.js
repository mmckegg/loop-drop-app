var computed = require('mutant/computed')
var ArrayGrid = require('array-grid')
var Observ = require('lib/property')

module.exports = applyColorFilter

function applyColorFilter (input, options) {
  var active = options && options.active
  if (typeof active !== 'function') {
    active = Observ(true)
  }
  return computed([input, active], function computeMapGridValues (input, active) {
    return ArrayGrid(input.data.map(function (value, i) {
      if (active.data && active.data[i] || active === true) {
        if (options.saturate != null) {
          value = saturate(value, options.saturate)
        }
        if (options.add != null) {
          value = add(value, options.add)
        }
        if (options.multiply != null) {
          value = multiply(value, options.multiply)
        }
        return [ clamp(value[0]), clamp(value[1]), clamp(value[2]) ]
      } else {
        return null
      }
    }), input.shape)
  })
}

function multiply (rgb, value) {
  if (typeof value === 'number') {
    value = [value, value, value]
  }
  return [
    rgb[0] * value[0],
    rgb[1] * value[1],
    rgb[2] * value[2]
  ]
}

function clamp (value) {
  if (value > 255) return 255
  if (value < 0) return 0
  return value
}

function add (rgb, value) {
  if (typeof value === 'number') {
    value = [value, value, value]
  }
  return [
    rgb[0] + value[0],
    rgb[1] + value[1],
    rgb[2] + value[2]
  ]
}

function saturate (rgb, value) {
  var gray = getLum(rgb)
  return [
    -gray * (value - 1) + rgb[0] * value,
    -gray * (value - 1) + rgb[1] * value,
    -gray * (value - 1) + rgb[2] * value
  ]
}

function getLum (rgb) {
  return 0.2989 * rgb[0] + 0.5870 * rgb[1] + 0.1140 * rgb[2]
}
