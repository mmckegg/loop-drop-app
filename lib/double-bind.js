var watch = require('mutant/watch')
var onceIdle = require('mutant/once-idle')

module.exports = function doubleBind (a, b, {idle = true} = {}) {
  var updatingA = false
  var updatingB = false
  var initialized = !idle // skip idle check if idle === false

  // delay reverse binding until load queue has processed
  onceIdle(() => { initialized = true })

  var releaseA = watch(a, function (value) {
    if (!updatingA) {
      updatingA = true
      b.set(value)
      updatingA = false
    }
  })
  var releaseB = watch(b, function (value) {
    if (initialized && !updatingB) {
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
