var Path = require('path')

module.exports = objectifyRecording

function objectifyRecording(data) {
  var setups = []

  var result = {
    start: data[0] && data[0][0] || 0,
    end: data[data.length-1] && data[data.length-1][0] || 0,
    setups: setups
  }
  
  for (var i=0;i<data.length;i++) {
    var item = data[i]
    var pos = item[0]
    var type = item[1]

    if (type === 'loadSetup') {
      var setupId = item[3]
      setups[setupId] = {
        name: getSetupName(item[2]),
        start: pos,
        path: item[2],
        end: result.end,
        chunks: {},
        pendingEvents: {}
      }
    } else if (type === 'closeSetup') {
      var setupId = item[2]
      setups[setupId].end = pos
    } else if (type === 'trigger') {
      var setupId = item[2]
      var id = item[3]
      var event = item[4]
      var container = setups[setupId]

      var split = id.split('/')
      var chunkId = split[0]
      var slotId = split[1]

      if (event === 'start') {
        container.pendingEvents[id] = pos
      } else if (event === 'stop') {
        if (container.pendingEvents[id] != null) {

          var slots = container.chunks[chunkId] = container.chunks[chunkId] || []
          var events = slots[slotId] = slots[slotId] || []

          events.push([
            container.pendingEvents[id],
            pos - container.pendingEvents[id]
          ])

          delete container.pendingEvents[id]
        }
      }
    }
  }

  return result
}

function getSetupName (path) {
  return Path.basename(Path.dirname(path))
}