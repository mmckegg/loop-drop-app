var Observ = require('mutant/value')
var Event = require('geval')
var join = require('path').join
var getDirName = require('path').dirname
var CallbackWorker = require('lib/callback-worker')

module.exports = function (path, options, onDone) {
  var obs = Observ()
  var scale = 40
  var height = 100
  var meta = null
  var paths = ''
  var markerPath = null
  var svgPath = path + '.svg'

  var broadcastAppend = null
  obs.onAppendChild = Event((b) => broadcastAppend = b)

  options.fs.readFile(svgPath, 'utf8', (err, value) => {
    if (err) {
      options.fs.readFile(path, 'utf8', (err, value) => {
        if (err) return onDone && onDone(err)
        meta = JSON.parse(value)
        var audioContext = new global.OfflineAudioContext(meta.channels || 2, 1, meta.sampleRate || 48000)
        var basePath = getDirName(path)
        var position = 0
        forEach(meta.segments, (segment, next) => {
          options.fs.readFile(join(basePath, segment.src), (err, buffer) => {
            if (err) return next(err)
            audioContext.decodeAudioData(buffer.buffer, (audioBuffer) => {
              getPathForData({
                data: audioBuffer.getChannelData(0),
                width: Math.ceil(audioBuffer.duration * scale),
                height: height,
                x: Math.ceil(position * scale)
              }, (err, path) => {
                if (err) return next(err)
                var element = `<path fill="white" d="${path}" />`
                paths += element
                broadcastAppend(element)
                refresh()
                position += audioBuffer.duration
                next()
              })
            }, next)
          })
        }, (err) => {
          if (err) {
            onDone && onDone(err)
          } else {
            onDone && onDone(null, obs())
            options.fs.writeFile(svgPath, obs(), () => {})
          }
        })
      })

      // cue points
      var timePath = path + '.time'
      options.fs.readFile(timePath, function (err, buffer) {
        if (!err) {
          var data = new Float32Array(new Uint8Array(buffer).buffer)
          markerPath = `<path d="${getMarkerPath(data, scale, height)}" fill="rgba(255,255,255,0.1)" />`
          refresh()
        }
      })
    } else {
      obs.set(value)
      onDone && onDone(null, value)
    }
  })

  function refresh () {
    if (meta) {
      var element = `<svg xmlns="http://www.w3.org/2000/svg" height="${height}" width="${Math.ceil(meta.duration * scale)}">
        ${paths}
        ${markerPath}
      </svg>`
      obs.set(element)
    }
  }

  return obs
}

var getPathForData = CallbackWorker((opts, cb) => {
  var width = opts.width + 1
  var height = opts.height
  var data = opts.data
  var x = opts.x || 0

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
  var result = `M ${x - 1},${height / 2}`
  maxValues.forEach((val, i) => {
    result += ` L${i + x},${Math.round(amp + (val * amp))}`
  })

  // end point
  result += ` L${width + x},${height / 2}`

  // bottom
  minValues.reverse().forEach((val, i) => {
    result += ` L${width + x - i - 1},${Math.round(amp + (val * amp))}`
  })

  cb(null, `${result} Z`)
})

function getMarkerPath (markers, scale, height) {
  var result = 'M0,0'

  for (var i = 0; i < markers.length; i++) {
    var x = Math.round(markers[i] * scale)
    if (i % 2) {
      result += line(x, 0) + line(x, height)
    } else {
      result += line(x, height) + line(x, 0)
    }
  }

  if (i > 0) {
    var x = Math.round(markers[i - 1] * scale)
    result += line(x, 0)
  }

  return result + ' Z'
}

function line (x, y) {
  return ' L' + x + ',' + y
}

function forEach (array, fn, cb) {
  var i = -1
  function next (err) {
    if (err) return cb && cb(err)
    i += 1
    if (i < array.length) {
      fn(array[i], next, i)
    } else {
      cb && cb(null)
    }
  }
  next()
}
