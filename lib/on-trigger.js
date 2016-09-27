var Event = require('geval')
var watch = require('@mmckegg/mutant/watch')

module.exports = function (items) {
  var releases = []
  var unwatch = null

  var result = Event(function (broadcast) {
    unwatch = watch(items, rebind)
    function rebind () {
      release()
      items.forEach(function (item, i) {
        if (item && item.node && item.node.onTrigger) {
          releases.push(item.node.onTrigger(function (data) {
            if (data.event === 'start') {
              broadcast(i)
            }
          }))
        }
      })
    }
  })

  result.destroy = function () {
    release()
    unwatch()
  }

  return result
  // scoped

  function release () {
    while (releases.length) {
      releases.pop()()
    }
  }
}
