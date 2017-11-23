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


      if (result.length === 1 && !result[0][1]) {
        var distanceFromEnd = to - result[0][0]
        console.log(id, distanceFromEnd)
        if (distanceFromEnd < 0.1) {
          // when there is only a single off event near the end of the loop,
          // lets assume that this was supposed to be held for the entire duration
          result.length = 0
        }
      }

      var isRoom = result.length > 0 && first(result)[0] > from

      // only insert preEvent if it terminates a held note at end of loop
      var willTerminate = isRoom && last(result)[1] && !preEvent[1]
      // or the loop doesn't have any event (preserve the state at start of loop)
      var isHeldLoop = !result.length && preEvent[1]

      if (willTerminate || isHeldLoop) {
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
