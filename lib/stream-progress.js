var pull = require('pull-stream')
var Value = require('mutant/value')

module.exports = StreamProgress

function StreamProgress ({sampleRate = 44100, duration}) {
  var length = 0
  var blockSize = 32 * 2 / 8
  var progress = Value(0)

  var result = pull.through((data) => {
    length += data.length / blockSize
    progress.set(length / (duration * sampleRate))
  })

  result.value = progress

  return result
}
