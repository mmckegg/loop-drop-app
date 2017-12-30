var watchAll = require('mutant/watch-all')
var CallbackWorker = require('lib/callback-worker')

module.exports = WaveHook

var caches = {}

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
          getPathForData({data, width, height}, function (err, path) {
            if (err) throw err
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

var getPathForData = CallbackWorker(function (opts, cb) {
  var data = opts.data
  var width = opts.width
  var height = opts.height

  var step = Math.ceil(data.length / width)
  var amp = (height / 2)

  var maxValues = []
  var minValues = []

  for (var i = 0; i < width; i++) {
    var min = 1.0
    var max = -1.0
    var defined = false
    for (var j = 0; j < step; j++) {
      var datum = data[(i * step) + j]
      if (datum < min) {
        min = datum
        defined = true
      }
      if (datum > max) {
        max = datum
        defined = true
      }
    }

    if (defined) {
      maxValues[i] = max
      minValues[i] = min
    } else {
      maxValues[i] = 0
      minValues[i] = 0
    }
  }

  // top
  var result = 'M0,' + (height / 2)
  maxValues.forEach(function (val, i) {
    result += ' L' + i + ',' + Math.round(amp + (val * amp))
  })

  // end point
  result += ' L' + width + ',' + (height / 2)

  // bottom
  minValues.reverse().forEach(function (val, i) {
    result += ' L' + (width - i - 1) + ',' + Math.round(amp + (val * amp))
  })

  cb(null, result + ' Z')
})
