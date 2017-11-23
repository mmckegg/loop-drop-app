var options = null
var outputs = []
var channelMapping = []
var outputPositions = []
var sampleCount = null
var position = 0

// First message should be object containing:
// { bitDepth, channelCount, map, samplesPerOutputChunk }

// Subsequent messages should contain TypedArrays at `bitDepth`
// Whenever the target sample count is hit, flush out the outputs as
// { outputs: [ArrayOfTypedArrays] } corresponding to map

self.onmessage = function (e) {
  if (ArrayBuffer.isView(e.data)) {
    if (options) {
      // process
      var { channelCount, samplesPerOutputChunk } = options
      for (var i = 0; i < e.data.length; i += 1) {
        var outputId = channelMapping[position % channelCount]
        var output = outputs[outputId]
        var outputPos = outputPositions[outputId]
        if (output) {
          output[outputPos] = e.data[i]
          outputPositions[outputId] += 1
        }
        position += 1

        if (position % channelCount === 0) {
          sampleCount += 1
          if (sampleCount === samplesPerOutputChunk) {
            self.postMessage({
              outputs: outputs
            }, outputs.map(getBuffer))
            allocate()
          }
        }
      }
    }
  } else if (!options) {
    // initialize
    options = e.data
    options.map.forEach((channels, i) => {
      // figure out the channel buffer assignments
      channels.forEach(channel => {
        channelMapping[channel] = i
      })
    })
    allocate()
  }
}

function allocate () {
  outputs.length = 0
  sampleCount = 0
  var {map, bitDepth, samplesPerOutputChunk} = options
  for (var i = 0; i < map.length; i++) {
    outputPositions[i] = 0
    outputs[i] = bitDepth === 32
      ? new Float32Array(map[i].length * samplesPerOutputChunk)
      : new Int16Array(map[i].length * samplesPerOutputChunk)
  }
}

function getBuffer (item) {
  return item.buffer
}
