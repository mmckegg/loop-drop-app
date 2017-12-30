var getPeaks = require('lib/get-peaks')

module.exports = function (data, count, offset, cb) {
  offset = offset || [0, 1]

  var range = (offset[1] - offset[0]) * data.length
  var windowSize = Math.ceil(range / count)
  var start = Math.floor(offset[0] * data.length)
  var end = Math.floor(offset[1] * data.length)
  var searchStart = Math.floor(start + (windowSize / 2))

  getPeaks({data, windowSize, start: searchStart, end}, (err, peaks) => {
    if (err) return cb(err)
    cb(null, [[start, 1]].concat(peaks).map(function (item) {
      return item[0] / data.length
    }))
  })
}
