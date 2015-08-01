var Readable = require('stream').Readable

module.exports = AudioBufferStream

function AudioBufferStream (audioBuffer, bitDepth) {
  var stream = new Readable()

  var bitDepth = bitDepth || 32

  var pos = 0
  var bufferLength = 4096
  var bytesPerChannel = bitDepth / 8
  var bytesPerFrame = bytesPerChannel * audioBuffer.numberOfChannels

  if (bitDepth !== 32 && bitDepth !== 16){
    throw new Error('bitDepth must be either 16 or 32')
  }

  var maxLength = audioBuffer.length * bytesPerFrame
  var remaining = maxLength
  var channels = []

  for (var i=0;i<audioBuffer.numberOfChannels;i++) {
    channels.push(audioBuffer.getChannelData(i))
  }

  stream._read = function (size) {
    var length = Math.min(remaining, bufferLength * bytesPerFrame)
    var frames = length / bytesPerFrame

    if (length <= 0) {
      this.push(null)
    } else {
      var buffer = new Buffer(length)
      for (var i=0;i<frames;i++) {
        for (var c=0;c<audioBuffer.numberOfChannels;c++) {
          var offset = (i * bytesPerFrame) + (c * bytesPerChannel)
          if (bitDepth === 32){
            buffer.writeFloatLE(channels[c][pos], offset)
          } else if (bitDepth === 16){
            write16BitPCM(buffer, offset, channels[c][pos])
          }
        }
        pos += 1
      }
      remaining -= length
      this.push(buffer)
    }
  }

  return stream
}

function write16BitPCM(output, offset, data){
  var s = Math.max(-1, Math.min(1, data))
  output.writeInt16LE(Math.floor(s < 0 ? s * 0x8000 : s * 0x7FFF), offset)
}