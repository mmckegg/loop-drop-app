var Path = require('path')

module.exports = objectifyRecording

function objectifyRecording(data) {
  var setups = []

  var timeMapping = []
  var lastTempo = 120
  var lastTime = 0
  var lastPosition = 0

  var result = {
    start: data[0] && data[0][0] || 0,
    end: (data[data.length-1] && data[data.length-1][0] || 0) + 4,
    setups: setups,
    timeMapping: timeMapping
  }
  
  for (var i=0;i<data.length;i++) {
    var item = data[i]
    var pos = item[0]
    var type = item[1]

    if (type === 'tempo') {
      var posSince = pos - lastPosition
      var timeSince = posSince * (60 / lastTempo)

      lastTempo = item[2]
      lastTime = lastTime + timeSince
      lastPosition = item[0]

      timeMapping.push({
        at: lastTime,
        beatDuration: (60 / lastTempo),
        position: pos,
        tempo: lastTempo
      })

    } else if (type === 'loadSetup') {
      var setupId = item[3]
      setups[setupId] = {
        name: getSetupName(item[2]),
        start: pos,
        path: item[2],
        end: result.end-4,
        chunks: {},
        pendingEvents: {}
      }
    } else if (type === 'closeSetup') {
      var setupId = item[2]
      setups[setupId].end = pos+4
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