var toPcm = require('lib/to-pcm')
var SegmentedWaveWriter = require('lib/segmented-wave-writer')

module.exports = recordNodeToDisk

function recordNodeToDisk (path, audioNode, onTick) {
  var ended = false
  var onFinish = null
  var recorder = audioNode.context.createScriptProcessor(16384, 2, 1)
  audioNode.connect(recorder)

  var startAt = audioNode.context.currentTime

  if (onTick) {
    var timer = setInterval(function () {
      onTick(audioNode.context.currentTime - startAt)
    }, 100)
  }

  var output = SegmentedWaveWriter(path, {
    channels: 2,
    sampleRate: audioNode.context.sampleRate,
    bitDepth: 32,
    format: 3, // float
    segmentLength: 64 // chunks
  }, function () {
    if (onFinish) {
      onFinish.apply(this, arguments)
    }
  })

  recorder.onaudioprocess = function (e) {
    if (output) {
      toPcm([
        e.inputBuffer.getChannelData(0),
        e.inputBuffer.getChannelData(1)
      ], function (err, buffer) {
        if (err) throw err
        if (output) {
          if (ended) {
            output.end(buffer)
            recorder.onaudioprocess = null
            recorder.disconnect()
            output = null
          } else {
            output.write(buffer)
          }
        }
      })
    }
  }

  recorder.connect(audioNode.context.destination)

  return function stopRecording (cb) {
    clearTimeout(timer)
    onFinish = cb
    ended = true
  }
}
