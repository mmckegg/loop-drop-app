self.onmessage = function (e) {
  var data = e.data.data
  var width = e.data.width
  var height = e.data.height

  var step = Math.ceil(data.length / width)
  var amp = (height / 2)

  var maxValues = []
  var minValues = []

  for (var i = 0; i < width; i++) {
    var min = 1.0
    var max = -1.0
    var defined = false
    for (var j = 0; j < step; j++) {
      var datum = data[(i * step) + j]
      if (datum < min) {
        min = datum
        defined = true
      }
      if (datum > max) {
        max = datum
        defined = true
      }
    }

    if (defined) {
      maxValues[i] = max
      minValues[i] = min
    } else {
      maxValues[i] = 0
      minValues[i] = 0
    }
  }

  // top
  var result = 'M0,' + (height / 2)
  maxValues.forEach(function (val, i) {
    result += ' L' + i + ',' + Math.round(amp + (val * amp))
  })

  // end point
  result += ' L' + width + ',' + (height / 2)

  // bottom
  minValues.reverse().forEach(function (val, i) {
    result += ' L' + (width - i - 1) + ',' + Math.round(amp + (val * amp))
  })

  self.postMessage({
    id: e.data.id,
    result: result + ' Z'
  })
}
