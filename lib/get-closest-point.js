module.exports = function getClosestPoint(markers, time) {
  if (markers && markers.length) {
    var prev = 0
    for (var i = 0; i < markers.length; i++) {
      if (time === markers[i]) {
        return time
      } else if (markers[i] > time) {
        var diff = markers[i] - time
        var prevDiff = time - prev
        if (diff > prevDiff) {
          return prev
        } else {
          return markers[i]
        }
      }
      prev = markers[i]
    }
  }
  return time
}