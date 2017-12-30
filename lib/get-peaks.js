var CallbackWorker = require('lib/callback-worker')
module.exports = CallbackWorker((opts, cb) => {
  var result = []
  var highestValue = 0
  var highestValuePos = 0
  var lastCross = 0
  var data = opts.data
  var windowSize = opts.windowSize
  var start = Math.max(0, opts.start)
  var step = opts.step || opts.windowSize
  var end = Math.min(opts.end, data.length)

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

  cb(null, result)
})
