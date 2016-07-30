var Through = require('through')
var watchGridChanges = require('observ-grid/watch-changes')

module.exports = DittyGridStream

function DittyGridStream(observableGrid, mapping, scheduler){

  var offEvents = {}
  var stream = Through()

  var removeListener = watchGridChanges(observableGrid, function(changes, isRevert){

    var resolvedMapping = typeof mapping === 'function' ?
      mapping() : mapping

    changes.forEach(function(change){
      var key = change[0] + '/' + change[1]
      if (offEvents[key]){
        offEvents[key].time = scheduler.context.currentTime
        offEvents[key].position = scheduler.getCurrentPosition()
        stream.queue(offEvents[key])
        offEvents[key] = null
      }

      if (change[2]){
        var id = resolvedMapping.get(change[0], change[1])
        if (id != null){

          // send on event
          stream.queue({
            time: scheduler.context.currentTime,
            position: scheduler.getCurrentPosition(),
            triggered: true,
            id: id,
            event: 'start'
          })

          // queue off event
          offEvents[key] = {
            id: id,
            triggered: true,
            event: 'stop'
          }
        }
      }
    })
  })

  stream.destroy = function(){
    if (removeListener){
      Object.keys(offEvents).forEach(function(key){
        if (offEvents[key]){
          stream.queue(offEvents[key])
        }
      })
      offEvents = {}
      removeListener()
      removeListener = null
    }
  }

  return stream
}
