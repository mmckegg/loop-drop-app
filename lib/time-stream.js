var Readable = require('stream').Readable

module.exports = TimeStream

function TimeStream (context, opts) {
  // time stamps
  var timeStream = new Readable({objectMode: true})
  var startAt = context.audio.currentTime
  var chunkDuration = opts && opts.chunkLength || 0.5
  var timeChunks = {}
  var timeOffset = 0.05
  var releaseSchedule = context.scheduler.onSchedule(function (data) {
    var from = Math.floor(data.from * 2) / 2
    var to = Math.floor(data.to * 2) / 2
    var hasCue = to - from
    if (hasCue) {
      var time = context.scheduler.getTimeAt(to) - startAt
      var chunk = Math.floor(time / chunkDuration)
      timeChunks[chunk] = time
      timeStream.push(time + timeOffset)
    }
  })

  timeStream._read = function () {}
  timeStream.on('end', function () {
    releaseSchedule()
  })
  timeStream.getCurrentTime = function () {
    return context.audio.currentTime - startAt + timeOffset
  }

  return timeStream
}
