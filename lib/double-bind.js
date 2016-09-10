var watch = require('@mmckegg/mutant/watch')

module.exports = function doubleBind (a, b) {
  var updatingA = false
  var updatingB = false
  var releaseA = watch(a, function (value) {
    if (!updatingA) {
      updatingA = true
      b.set(value)
      updatingA = false
    }
  })
  var releaseB = watch(b, function (value) {
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
