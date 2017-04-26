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

      var preEvent = [0, false]

      for (var i = 0; i < count; i++) {
        var ev = track[i]

        if (ev[0] >= to) {
          break
        }

        if (ev[0] >= from) {
          result.push(ev)
        } else {
          preEvent = ev
        }
      }

      if (
        result.length > 1 &&
        last(result)[1] === first(result)[1] &&
        last(result)[1] !== preEvent[1] &&
        first(result)[0] > from
      ) {
        result.unshift([from].concat(preEvent.slice(1)))
      }
    }
    return result
  }

  return write
}

function last (array) {
  return array[array.length - 1]
}

function first (array) {
  return array[0]
}
