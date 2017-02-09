var watchAll = require('mutant/watch-all')
var getValue = require('lib/get-value')

module.exports = WaveHook

// WORKER
var worker = new global.Worker('file://' + __dirname + '/../worker/wave-path.js')
var callbacks = {}
var caches = {}
var nextId = 0
worker.onmessage = function (e) {
  if (callbacks[e.data.id]) {
    callbacks[e.data.id](e.data.result)
    delete callbacks[e.data.id]
  }
}

function WaveHook (node, gain, width, height) {
  return function (element) {
    return watchAll([node.buffer.currentValue, gain], function (buffer, gain) {
      if (buffer) {
        var data = buffer ? buffer.getChannelData(0) : []
        var step = data.length / width
        var quant = Math.ceil(step)
        var currentWidthScale = quant / step

        var offsetHeight = (((gain * height) - height) / 2) / gain
        element.setAttribute('transform', 'scale(' + currentWidthScale + ' ' + gain + ') translate(0 ' + -offsetHeight + ')')

        var cache = getCache(width, height)
        var path = cache.get(buffer)

        if (!path) {
          getPathForData(data, width, height, function (path) {
            cache.set(buffer, path)
            element.setAttribute('d', path)
          })
        } else {
          element.setAttribute('d', path)
        }
      }
    })
  }
}

function getCache (width, height) {
  var key = this.width + '/' + this.height
  if (!caches[key]) {
    caches[key] = new WeakMap()
  }
  return caches[key]
}

function getPathForData (data, width, height, cb) {
  var id = nextId++
  callbacks[id] = cb
  worker.postMessage({
    data: data,
    id: id,
    width: width,
    height: height
  })
}
