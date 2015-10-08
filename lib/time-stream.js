var Readable = require('stream').Readable

module.exports = TimeStream

function TimeStream (context, audioStream, opts) {
  // time stamps
  var timeStream = new Readable({objectMode: true})
  var chunkLength = opts && opts.chunkLength || 256
  var startAt = context.audio.currentTime
  var chunkDuration = chunkLength / context.audio.sampleRate
  var timeChunks = {}
  var timeOffset = -0.02
  var releaseSchedule = context.scheduler.onSchedule(function(data) {
    var from = Math.floor(data.from * 2) / 2
    var to = Math.floor(data.to * 2) / 2
    var hasCue = to - from
    if (hasCue) {
      var time = context.scheduler.getTimeAt(data.to) - startAt
      var chunk = Math.floor(time / chunkDuration)
      timeChunks[chunk] = time
    }
  })

  timeStream._read = function () {}
  timeStream.on('end', function () {
    releaseSchedule()
  })
  timeStream.getCurrentTime = function () {
    return context.audio.currentTime - startAt + timeOffset
  }

  audioStream.on('chunk', function (id, written) {
    if (written) {
      if (timeChunks[id] != null) {
        timeStream.push(timeChunks[id] + timeOffset)
        timeStream.lastValue = timeChunks[id] + timeOffset
      }
    } else {
      timeOffset -= chunkDuration
    }
  })
  audioStream.on('end', function () {
    timeStream.push(null)
  })
  return timeStream
}
