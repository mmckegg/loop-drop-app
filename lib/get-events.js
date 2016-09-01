module.exports = getEvents

function getEvents (loop, from, to, minOverlap) {
  var result = []
  minOverlap = minOverlap || 0

  if (loop && loop.events && loop.events.length) {
    var count = loop.events.length
    var offset = floorWith(from, loop.length)

    var lastEvent = loop.events[count - 1]
    var lastAt = offset - loop.length + lastEvent[0]

    for (
      var i = 0, at = loop.events[0][0] + offset; at < to;
      i += 1, at = loop.events[i % count][0] + offset + (Math.floor(i / count) * loop.length)
    ) {
      var value = loop.events[i % count][1]
      if (at >= from) {
        result.push([at, value])
      } else {
        lastEvent = loop.events[i % count]
        lastAt = at
      }
    }

    // include overlap
    if (!result.length || result[0][0] > from) {
      var overlap = round10(getTimeToNextEvent(loop, lastEvent) - (from - lastAt))
      if (!lastEvent[1] || overlap >= minOverlap) {
        result.unshift([from, lastEvent[1]])
      }
    }
  } else {
    result.push([from, null])
  }

  return result
}

function floorWith (value, grid) {
  return Math.floor(value / grid) * grid
}

function getTimeToNextEvent (loop, event) {
  var index = loop.events.indexOf(event) + 1
  var nextEvent = loop.events[index % loop.events.length]
  var at = nextEvent[0] <= event[0]
    ? nextEvent[0] + loop.length
    : nextEvent[0]
  return at - event[0]
}

function round10 (value) {
  return Math.round(value * 10000000000) / 10000000000
}
