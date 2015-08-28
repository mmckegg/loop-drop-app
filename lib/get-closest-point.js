module.exports = function getClosestPoint(markers, time) {
  if (markers && markers.length) {
    var prev = 0
    for (var i = 0; i < markers.length; i++) {
      var marker = markers[i]//-0.02
      if (time === marker) {
        return time
      } else if (marker > time) {
        var diff = marker - time
        var prevDiff = time - prev
        if (diff > prevDiff) {
          return prev
        } else {
          return marker
        }
      }
      prev = marker
    }
  }
  return time
}