var worker = new Worker('file://' + __dirname + '/worker/peaks.js')
var callbacks = {}
var nextId = 0

worker.onmessage = function (e) {
  if (callbacks[e.data.id]) {
    callbacks[e.data.id](e.data.result)
    delete callbacks[e.data.id]
  }
}

module.exports = function (data, count, offset, cb) {
  var id = nextId++
  offset = offset || [0, 1]

  var range = (offset[1] - offset[0]) * data.length
  var windowSize = Math.ceil(range / count)
  var start = Math.floor(offset[0] * data.length)
  var end = Math.floor(offset[1] * data.length)
  var searchStart = Math.floor(start + (windowSize / 2))

  callbacks[id] = function (peaks) {
    cb([[start, 1]].concat(peaks).map(function (item) {
      return item[0] / data.length
    }))
  }

  worker.postMessage({
    id: id,
    data: data,
    windowSize: windowSize,
    start: searchStart,
    end: end
  })
}
