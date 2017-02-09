var assert = require('assert')
var GrabGrid = require('../grab-grid')
var ObservGrid = require('observ-grid')
var Observ = require('mutant/value')

var grid = ObservGrid([0,0,0,0], [2,2])

var grab = GrabGrid(grid)
var changes = []

var release1 = grab(function (value) {
  changes.push([1, value.data])
})

grid.set(0, 0, 1)
grid.set(0, 1, 10)

var release2 = grab(function (value) {
  changes.push([2, value.data])
})

var release3 = grab(function (value) {
  changes.push([3, value.data])
}, { exclude: [0, 1]})

grid.set(0, 1, 1)
grid.set(0, 0, 0)
grid.set(1, 1, 1)

var release4 = grab(function (value) {
  changes.push([4, value.data])
}, { exclude: Observ([2])})

grid.set(1, 0, 1)

assert.deepEqual(changes, [
  [ 1, [] ],
  [ 1, [ 1 ] ],
  [ 1, [ 1, 10 ] ],
  [ 2, [] ],
  [ 3, [] ],
  [ 1, [ 1, null ] ],
  [ 2, [ , 1 ] ],
  [ 1, [ null, null ] ],
  [ 3, [ , , , 1 ] ],
  [ 4, [] ],
  [ 3, [ , , 1, 1 ] ]
])
