module.exports = function (transform) {
  var repeater = {}

  var release = null
  var releaseTransform = null

  var activeGrid = null
  var repeatLength = 1
  var offset = 0

  repeater.setLength = function (value) {
    repeatLength = value
    refresh()
  }

  repeater.getRepeat = function () {
    if (release) {
      return repeatLength
    }
  }

  repeater.start = function (inputGrabber, length, offbeat) {
    offset = offbeat ? length / 2 : 0
    if (!release) {
      if (length != null) {
        repeatLength = length
      }

      release = inputGrabber(function (grid) {
        activeGrid = grid
        refresh()
      })

      refresh()
    } else if (length != null) {
      repeater.setLength(length)
    }
  }

  repeater.stop = function () {
    if (release) {
      release()
      release = null
    }
    activeGrid = null
    refresh()
  }

  function refresh () {
    if (releaseTransform) {
      releaseTransform()
      releaseTransform = null
    }

    var active = []

    if (activeGrid) {
      activeGrid.data.forEach(function (val, i) {
        if (val) {
          active.push(i)
        }
      })
    }

    if (active.length && repeatLength != null) {
      releaseTransform = transform(repeat, active, repeatLength, offset)
    }
  }

  return repeater
}

function repeat (input, active, length, offset) {
  active.forEach(function (index) {
    if (length === 0) { // suppress
      input.data[index] = null
    } else {
      input.data[index] = {
        events: [[0 + offset, true], [length / 2 + offset, false]],
        length: length
      }
    }
  })
  return input
}
