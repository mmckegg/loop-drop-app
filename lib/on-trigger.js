var Event = require('geval')
var watch = require('@mmckegg/mutant/watch')

module.exports = function (items) {
  var releases = []

  var result = Event(function (broadcast) {
    watch(items, rebind)
    function rebind () {
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

  result.destroy = release

  return result
  // scoped

  function release () {
    while (releases.length) {
      releases.pop()()
    }
  }
}
