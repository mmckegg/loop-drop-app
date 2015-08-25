var Event = require('geval')

module.exports = function (items) {
  return Event(function(broadcast) {
    var releases = []
    items(rebind)

    function rebind () {
      while (releases.length) {
        releases.pop()()
      }

      items.forEach(function(item, i) {
        if (item && item.node && item.node.onTrigger) {
          releases.push(item.node.onTrigger(function(data) {
            if (data.event === 'start') {
              broadcast(i)
            }
          }))
        }
      })
    }
  })
}