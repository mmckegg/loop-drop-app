module.exports = setLights

var message = [240, 0, 32, 41, 2, 17, 120, 8]
var off = 0

function setLights (state, stream) {
  var currentState = {}
  stream(function (port) {
    if (port) {
      var toUpdate = []
      Object.keys(currentState).forEach(function (key) {
        var id = parseInt(key, 10)
        var value = currentState[key] || off
        toUpdate.push(id, value)
      })
      if (toUpdate.length) {
        stream.write(message.concat(toUpdate.slice(0, 64), 247))
        if (toUpdate.length > 64) {
          stream.write(message.concat(toUpdate.slice(64), 247))
        }
      }
    }
  })
  return state(function (values) {
    var toUpdate = []
    values.forEach(function (value, id) {
      if (!same(currentState[id], value)) {
        currentState[id] = value || 0
        toUpdate.push(id, value)
      }
    })
    if (toUpdate.length) {
      stream.write(message.concat(toUpdate, 247))
    }
  })
}

function same (a, b) {
  return a === b
}
