var Observ = require('observ')
var ArrayGrid = require('array-grid')
var getEvents = require('loop-grid/lib/get-events')

module.exports = function (transform, shape, stride) {
  var self = Observ(ArrayGrid([], resolve(shape), resolve(stride)))

  var release = null
  var doneCallback = null

  var set = self.set
  self.set = null

  self.start = function (at, suppressIndexes, freezeIndexes, done) {
    self.stop()

    suppressIndexes = suppressIndexes || []
    freezeIndexes = freezeIndexes || []

    // transform
    release = transform(suppress, at, suppressIndexes, freezeIndexes)

    // update observable grid
    var data = suppressIndexes.reduce(function (result, index) {
      result[index] = true
      return result
    }, [])

    set(ArrayGrid(data, resolve(shape), resolve(stride)))

    doneCallback = done
  }

  self.stop = function () {
    if (release) {
      set(ArrayGrid([], resolve(shape), resolve(stride)))
      release()
      release = null
      if (typeof doneCallback === 'function') {
        doneCallback()
        doneCallback = null
      }
    }
  }

  return self
}

function suppress (input, start, indexes, freezeIndexes) {
  input.data.forEach(function (loop, i) {
    if (loop && (!indexes.length || ~indexes.indexOf(i))) {
      if (!indexes.length && ~freezeIndexes.indexOf(i)) {
        // HACK: this could be handled a lot more elegantly
        // and also when to use freezeIndexes is pretty poor
        var events = getEvents(loop, start, start + 0.01, 0)
        if (events.length && events[0][1]) {
          loop.events = [[0, true]]
        } else {
          loop.events = []
        }
      } else {
        loop.events = []
      }
    }
  })
  return input
}

function resolve (obs) {
  return typeof obs === 'function' ? obs() : obs
}
