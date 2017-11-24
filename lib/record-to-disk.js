var toPcm = require('lib/to-pcm')
var SegmentedWaveWriter = require('lib/segmented-wave-writer')

module.exports = recordToDisk

function recordToDisk (audioContext, nodes, onTick) {
  var outputPaths = Object.keys(nodes)
  var totalChannelsToRecord = outputPaths.reduce((result, path) => {
    return result + nodes[path].channelCount
  }, 0)

  var ended = false
  var onFinish = null
  var toFinish = outputPaths.length
  var connections = []

  var recorder = audioContext.createScriptProcessor(16384, totalChannelsToRecord, 1)

  var startAt = audioContext.currentTime

  if (onTick) {
    var timer = setInterval(function () {
      onTick(audioContext.currentTime - startAt)
    }, 100)
  }

  var outputs = []
  var useEasyRoute = totalChannelsToRecord === 2 && outputPaths === 1

  if (useEasyRoute) {
    var node = nodes[outputPaths[0]]
    node.connect(recorder)
    connections.push([node, recorder])
  } else {
    var merger = audioContext.createChannelMerger(totalChannelsToRecord)
    merger.connect(recorder)

    var assignedChannels = 0
    outputPaths.forEach(path => {
      var node = nodes[path]
      var channelCount = node.channelCount

      var splitter = audioContext.createChannelSplitter(channelCount)
      node.connect(splitter)
      connections.push([node, splitter])

      for (var channel = 0; channel < channelCount; channel++) {
        splitter.connect(merger, channel, assignedChannels)
        assignedChannels += 1
      }
    })
  }

  outputPaths.forEach((path, i) => {
    outputs[i] = SegmentedWaveWriter(path, {
      channels: nodes[path].channelCount,
      sampleRate: audioContext.sampleRate,
      bitDepth: 32,
      format: 3, // float
      segmentLength: 64 // chunks
    }, function (err) {
      toFinish -= 1
      if (onFinish && (!toFinish || err)) {
        onFinish.apply(null, err)
        onFinish = null
      }
    })
  })

  recorder.onaudioprocess = function (e) {
    var count = 0
    outputPaths.forEach((path, i) => {
      var output = outputs[i]
      var channels = []
      for (var channel = 0; channel < nodes[path].channelCount; channel++) {
        channels.push(e.inputBuffer.getChannelData(count))
        count += 1
      }
      toPcm(channels, function (err, buffer) {
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
    })
  }

  recorder.connect(audioContext.destination)

  return function stopRecording (cb) {
    clearTimeout(timer)
    onFinish = cb
    ended = true

    while (connections.length) {
      connections[0][0].disconnect(connections[0][1])
      connections.shift()
    }
  }
}
