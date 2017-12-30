var getPeaks = require('lib/get-peaks')

module.exports = function (data, count, offset, cb) {
  offset = offset || [0, 1]

  var range = (offset[1] - offset[0]) * data.length
  var step = Math.ceil(range / count / 2)
  var windowSize = Math.ceil(range / count)
  var start = Math.floor(offset[0] * data.length)
  var end = Math.floor(offset[1] * data.length)

  getPeaks({data, windowSize, step, start, end}, (err, peaks) => {
    if (err) return cb(err)
    peaks = [[start, 1]].concat(peaks)
    cb(peaks.filter(function (peak, i) {
      var prev = peaks[i - 1]
      return peak[0] < end && (!prev || (peak[0] - prev[0]) > step / 4)
    }).sort(function (a, b) {
      return a[1] - b[1]
    }).slice(-count).sort(function (a, b) {
      return a[0] - b[0]
    }).map(function (item) {
      return Math.min(offset[1], item[0] / data.length)
    }))
  })
}
