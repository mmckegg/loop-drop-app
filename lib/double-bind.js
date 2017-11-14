module.exports = function doubleBind (a, b) {
  var updatingA = false
  var updatingB = false

  // initial sync
  b.set(a())
  a.set(b())

  var releaseA = a(function (value) {
    if (!updatingA) {
      updatingA = true
      b.set(value)
      updatingA = false
    }
  })

  var releaseB = b(function (value) {
    if (!updatingB) {
      updatingB = true
      a.set(value)
      updatingB = false
    }
  })
  return function release () {
    releaseA()
    releaseB()
    releaseA = releaseB = null
  }
}
