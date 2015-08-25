var Observ = require('observ')

module.exports = FlashArray

function FlashArray () {
  var obs = Observ([])
  var active = []
  var refreshing = false

  obs.flash = function(i, value, duration) {
    
    var obj = [i, value]
    active.push(obj)
    refresh()

    setTimeout(function() {
      active.splice(active.indexOf(obj), 1)
      refresh()
    }, duration)
  
  }

  return obs

  function refresh () {
    if (!refreshing) {
      refreshing = true
      window.requestAnimationFrame(refreshNow)
    }
  }

  function refreshNow() {
    obs.set(active.reduce(flatten, []))
    refreshing = false
  }
}

function flatten(result, obj) {
  result[obj[0]] = obj[1]
  return result
}