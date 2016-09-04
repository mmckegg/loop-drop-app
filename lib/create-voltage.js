var bufferCache = new WeakMap()

module.exports = createVoltage

function createVoltage (audioContext, value) {
  if (value == null) {
    value = 1
  }

  var buffer = null
  if (value === 1) {
    buffer = bufferCache.get(audioContext)
    if (!buffer) {
      buffer = generateBuffer(audioContext, 1)
      bufferCache.set(audioContext)
    }
  } else {
    buffer = generateBuffer(audioContext, value)
  }

  // Create a source for the buffer, looping it
  var source = audioContext.createBufferSource()
  source.buffer = buffer
  source.loop = true
  return source
}

function generateBuffer (audioContext, value) {
  var buffer = audioContext.createBuffer(1, 2, audioContext.sampleRate)
  var data = buffer.getChannelData(0)
  data[0] = value
  data[1] = value
  return buffer
}
