var ObservGrid = require('observ-grid')
var watchGridChanges = require('observ-grid/watch-changes')
var computed = require('mutant/computed')

module.exports = function (shape) {
  var self = ObservGrid([], shape)

  self.selectedIndexes = computed([self], function (selectionGrid) {
    return selectionGrid.data.reduce(function (result, value, i) {
      if (value) {
        result.push(i)
      }
      return result
    }, [])
  })

  var release = null
  var doneCallback = null
  var down = []

  self.start = function (input, done) {
    self.stop()
    release = watchGridChanges(input, handleInput)
    doneCallback = done
  }

  self.clear = function () {
    self.data.set([])
    down.length = 0
  }

  self.stop = function () {
    if (release) {
      release()
      release = null
      if (typeof doneCallback === 'function') {
        doneCallback()
        doneCallback = null
      }
    }
  }

  return self

  function handleInput (changes) {
    changes.forEach(function (change) {
      var key = change.slice(0, 2).join('/')
      if (change[2]) {
        if (down.length) {
          var startCoords = down[0].split('/').map(pint)
          selectRange(startCoords, change)
        } else {
          toggleSelected(change[0], change[1])
        }
        down.push(key)
      } else {
        remove(down, key)
      }
    })
  }

  function selectRange (start, end) {
    var rowStart = Math.min(start[0], end[0])
    var rowEnd = Math.max(start[0], end[0])
    var colStart = Math.min(start[1], end[1])
    var colEnd = Math.max(start[1], end[1])

    self.transaction(function (raw) {
      for (var row = rowStart; row <= rowEnd; row++) {
        for (var col = colStart; col <= colEnd; col++) {
          raw.set(row, col, true)
        }
      }
    })
  }

  function toggleSelected (row, col) {
    if (self.get(row, col)) {
      self.set(row, col, null)
    } else {
      self.set(row, col, true)
    }
  }
}

function pint (val) {
  return parseInt(val, 10)
}

function remove (array, value) {
  var index = array.indexOf(value)
  if (~index) {
    array.splice(index, 1)
  }
}
