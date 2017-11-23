var portAudio = require('naudiodon')
var SegmentedWaveWriter = require('lib/segmented-wave-writer')
var reinterleavePcm = require('lib/reinterleave-pcm')

module.exports = recordExternalAudioToDisk

function recordExternalAudioToDisk ({sampleRate, deviceId, map}) {
  var onFinish = null
  var finished = new Set()

  var channelCount = getMaxChannel(map) + 1
  var bitDepth = 16

  var input = new portAudio.AudioInput({
    channelCount,
    sampleFormat: portAudio.SampleFormat16Bit,
    sampleRate,
    deviceId
  })

  var outputPaths = Object.keys(map)

  var outputs = outputPaths.map(path => {
    return SegmentedWaveWriter(path, {
      channels: map[path].length,
      sampleRate,
      bitDepth,
      format: bitDepth === 32 ? 3 : 1,
      segmentLength: 64 // chunks
    }, function () {
      finished.add(path)
      if (finished.size === outputPaths.length) {
        var cb = onFinish
        onFinish = null
        if (cb) cb()
      }
    })
  })

  reinterleavePcm(input, {
    channelCount,
    bitDepth,
    map: outputPaths.map(x => map[x]),
    samplesPerOutputChunk: 16384
  }, function (err, chunks) {
    if (err) throw err
    chunks.forEach((chunk, i) => {
      outputs[i].write(chunk)
    })
  })

  setTimeout(function () {
    input.start()
  }, 100)

  return function stopRecording (cb) {
    onFinish = cb
    input.quit()
  }
}

function getMaxChannel (map) {
  var maxChannel = 0
  Object.keys(map).forEach(key => {
    map[key].forEach(channel => {
      if (maxChannel < channel) {
        maxChannel = channel
      }
    })
  })
  return maxChannel
}
