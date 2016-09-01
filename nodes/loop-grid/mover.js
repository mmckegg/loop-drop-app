module.exports = function (transform) {
  var releases = []
  var currentCallback = null
  var currentSelection = null
  var releaseTransform = null

  function release () {
    releases.forEach(invoke)
    releases.length = 0

    releaseTransform && releaseTransform()
    releaseTransform = null

    if (typeof currentCallback === 'function') {
      currentCallback()
      currentCallback = null
    }
  }

  function handleInput (values) {
    if (currentSelection) {
      var origin = values.coordsAt(Math.min.apply(Math, currentSelection))
      var offsets = []

      releaseTransform && releaseTransform()
      releaseTransform = null

      values.data.forEach(function (value, i) {
        if (value) {
          var coords = values.coordsAt(i)
          offsets.push([coords[0] - origin[0], coords[1] - origin[1]])
        }
      })

      if (offsets.length) {
        var selection = currentSelection.map(function (index) {
          return values.coordsAt(index)
        })
        releaseTransform = transform(move, selection, offsets)
      }
    }
  }

  return {
    start: function (inputGrid, selectedIndexes, done) {
      release()
      currentSelection = selectedIndexes
      currentCallback = done
      releases.push(
        inputGrid(handleInput)
      )
    },

    stop: function () {
      release()
    }
  }
}

function move (input, selection, offsets) {
  var newLoops = []
  selection.forEach(function (coords) {
    var loop = input.get(coords[0], coords[1])
    if (loop) {
      offsets.forEach(function (offset) {
        newLoops.push([coords[0] + offset[0], coords[1] + offset[1], loop])
      })
      input.set(coords[0], coords[1], null)
    }
  })
  newLoops.forEach(function (change) {
    input.set(change[0], change[1], change[2])
  })
  return input
}

function invoke (f) {
  return f()
}
