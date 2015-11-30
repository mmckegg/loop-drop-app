self.onmessage = function (e) {
  var result = []
  var highestValue = 0
  var highestValuePos = 0
  var lastCross = 0
  var id = e.data.id
  var data = e.data.data
  var windowSize = e.data.windowSize
  var start = Math.max(0, e.data.start)
  var step = e.data.step || e.data.windowSize
  var end = Math.min(e.data.end, data.length)

  for (var i = start; i < end; i += step) {
    for (var pos = i; pos < windowSize + i; pos++) {
      var value = data[pos]

      if (value === 0 || (pos - lastCross > 128 && value < 0.01)) {
        lastCross = pos
      }

      if (value > highestValue) {
        highestValue = value
        highestValuePos = pos
      }
    }
    result.push([highestValuePos, highestValue])
    highestValue = 0
  }

  self.postMessage({
    id: id,
    result: result
  })
}
