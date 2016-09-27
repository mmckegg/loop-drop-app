var CallbackWorker = require('lib/callback-worker')

module.exports = function (data, cb) {
  toPcm(data, (err, result) => {
    if (err) return cb(err)
    cb(null, Buffer.from(result.buffer))
  })
}

var toPcm = CallbackWorker(function (channelData, cb) {
  var channelCount = channelData.length
  var sampleCount = channelData[0].length

  var result = new Float32Array(channelCount * sampleCount)

  for (var i = 0; i < sampleCount; i++) {
    for (var c = 0; c < channelCount; c++) {
      result[i * channelCount + c] = channelData[c][i]
    }
  }

  cb(null, result, [result.buffer])
})
