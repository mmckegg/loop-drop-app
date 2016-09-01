module.exports = LoopRecorder

function LoopRecorder () {
  var tracks = {}

  var write = function (id, position, value) {
    tracks[id] = tracks[id] || []
    tracks[id].push([position, value])
  }

  write.truncate = function (to) {
    Object.keys(tracks).forEach(function (id) {
      // ensure 1 item always remains for storing last state
      for (var index = 0; index < tracks[id].length - 1; index++) {
        if (tracks[id][index][0] >= to) break
      }
      if (index) {
        tracks[id].splice(0, index)
      }
    })
  }

  write.getRange = function (id, from, to) {
    var result = []
    if (tracks[id] && tracks[id].length) {
      var track = tracks[id]
      var count = track.length

      var lastEvent = [0, null]

      for (var i = 0; i < count; i++) {
        var ev = track[i]

        if (ev[0] >= to) {
          break
        }

        if (ev[0] >= from) {
          result.push(ev)
        } else {
          lastEvent = ev
        }
      }

      if (!result.length || result[0][0] > from) {
        result.unshift([from].concat(lastEvent.slice(1)))
      }
    }
    return result
  }

  return write
}
