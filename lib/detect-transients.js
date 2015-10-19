module.exports = function (data, count, offset) {
  offset = offset || [0,1]


  var range = (offset[1]-offset[0]) * data.length
  var step = Math.ceil(range / (count * 2))
  var start = Math.floor(offset[0] * data.length)
  var end = Math.ceil(offset[1] * data.length)
  var frame = step * 2

  var peaks = [
    // force include start
    [start, 1]
  ]

  for (var pos = start + step; pos < end; pos += step) {
    var peak = getPeak(data, pos, frame)
    if (peak[0] > peaks[peaks.length-1][0]) {
      peaks.push(peak)
    }
  }

  var peaks = peaks.sort(function (a, b) {
    return a[1]-b[1]
  }).slice(-count).sort(function (a,b) {
    return a[0]-b[0]
  })

  return peaks.map(function (item) {
    return item[0] / data.length
  })
}

function getPeak (data, offset, length) {
  var peak = 0
  var pos = offset
  var end = offset + length
  var abs = Math.abs
  var lastCross = pos

  for (var i = offset; i < end; i++) {

    if (data[i] === 0 || (i - lastCross > 128 && data[i] < 0.01 && data[i] > -0.01)) {
      lastCross = i
    }

    var val = abs(data[i])
    if (val > peak) {
      peak = val
      pos = lastCross
    }
  }

  return [ pos, peak ]
}
