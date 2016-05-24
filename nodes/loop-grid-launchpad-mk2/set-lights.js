module.exports = setLights

var setRgb = [240, 0, 32, 41, 2, 24, 11]
var setPulse = [240, 0, 32, 41, 2, 24, 40]

var off = [0, 0, 0]

function setLights (state, stream) {
  var currentState = {}
  stream(function (port) {
    if (port) {
      var toUpdate = []
      var toPulse = []

      Object.keys(currentState).forEach(function (key) {
        var id = parseInt(key, 10)
        var rgb = currentState[key] || off
        if (Array.isArray(rgb)) {
          toUpdate.push(id, format(rgb[0]), format(rgb[1]), format(rgb[2]))
        } else {
          toPulse.push(0, id, rgb)
        }
      })
      if (toUpdate.length) {
        stream.write(setRgb.concat(toUpdate.slice(0, 64), 247))
        if (toUpdate.length > 64) {
          stream.write(setRgb.concat(toUpdate.slice(64), 247))
        }
      }
      if (toPulse.length) {
        stream.write(setRgb.concat(toPulse, 247))
      }
    }
  })
  return state(function (value) {
    var toUpdate = []
    var toPulse = []

    for (var r = 0; r < value.shape[0]; r++) {
      for (var c = 0; c < value.shape[1]; c++) {
        var id = ((8 - r) * 10) + (c + 1)
        if (!same(currentState[id], value.get(r, c))) {
          var rgb = currentState[id] = value.get(r, c) || off
          if (Array.isArray(rgb)) {
            toUpdate.push(id, format(rgb[0]), format(rgb[1]), format(rgb[2]))
          } else {
            toPulse.push(0, id, rgb)
          }
        }
      }
    }
    if (toUpdate.length) {
      stream.write(setRgb.concat(toUpdate, 247))
    }
    if (toPulse.length) {
      stream.write(setPulse.concat(toPulse, 247))
    }
  })
}

function format (value) {
  return Math.floor(value / 4)
}

function same (a, b) {
  if (a == null && b == null) {
    return true
  } else {
    return (a === b) || (typeof a !== 'number' && a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2])
  }
}
