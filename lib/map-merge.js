var watchArray = require('observ-node-array/watch')
var watch = require('observ/watch')

function MapMerge(collection, key) {
  var obs = Observ({})
  var lastMapped = []
  var changing = false

  watchArray(collection, function (item) {
    var release = watch(item[key], changed)
    return function () {
      release()
      changed()
    }
  })

  function refresh () {
    if (changing){
      if (Array.isArray(nodeArray._list)){
        obs._list = nodeArray._list.map(getValue)
        obs._raw = rawKeyOrFunction ? nodeArray._list.map(getRawValue) : obs._list
        obs.set(obs._list.map(resolve))
      }
      changing = false
    }
  }

  function changed(){
    if (!changing){
      nextTick(refresh)
    }
    changing = true
  }

  return obs
}