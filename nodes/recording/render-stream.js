var PassThrough = require('stream').PassThrough
var renderTimeline = require('./render-timeline')
var AudioBufferStream = require('./audio-buffer-stream')
var Property = require('observ-default')

module.exports = TimelineRenderStream

function TimelineRenderStream (timeline, startOffset, duration, bitDepth) {
  var context = timeline.context

  var stream = new PassThrough()
  stream.context = context
  stream.progress = Property()

  var remaining = duration
  var chunkSize = 30
  var chunkId = 0
  var endTime = startOffset + duration

  nextChunk()

  function nextChunk () {
    if (remaining > 0) {
      var chunkDuration = Math.min(remaining, chunkSize)
      var chunkOffset = endTime - remaining
      renderTimeline(context, timeline(), chunkOffset, chunkDuration, function (err, audioBuffer) {
        streamOut(audioBuffer, nextChunk)
      })(function (pos) {
        stream.progress.set((chunkOffset + chunkDuration * pos) / duration)
      })
      remaining -= chunkDuration
      chunkId += 1
    } else {
      done()
    }
  }

  function streamOut (audioBuffer, cb) {
    var chunkStream = AudioBufferStream(audioBuffer, bitDepth)
    chunkStream.on('end', cb).on('error', cb)
    chunkStream.pipe(stream, { end: false })
  }

  function done () {
    stream.end()
  }

  return stream
}
