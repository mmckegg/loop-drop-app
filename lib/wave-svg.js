var Observ = require('@mmckegg/mutant/value')
var Event = require('geval')
var join = require('path').join
var getDirName = require('path').dirname

module.exports = function (path, options, onDone) {
  var obs = Observ()
  var remaining = null
  var position = 0
  var chunkDuration = 2

  var scale = 40
  var height = 100

  var meta = null
  var paths = ''
  var markerPath = null
  var svgPath = path + '.svg'

  var broadcastAppend = null
  obs.onAppendChild = Event(function (broadcast) {
    broadcastAppend = broadcast
  })

  options.fs.readFile(svgPath, 'utf8', function (err, value) {
    if (err) {
      options.fs.readFile(path, 'utf8', function (err, value) {
        if (err) return onDone && onDone(err)
        meta = JSON.parse(value)
        var audioContext = new global.OfflineAudioContext(meta.channels || 2, 1, meta.sampleRate || 48000)
        var basePath = getDirName(path)
        var position = 0
        forEach(meta.segments, function (segment, next) {
          options.fs.readFile(join(basePath, segment.src), function (err, buffer) {
            if (err) return next(err)
            audioContext.decodeAudioData(buffer.buffer, function (audioBuffer) {
              var data = audioBuffer.getChannelData(0)
              var path = getPathForData(data, Math.ceil(audioBuffer.duration * scale), height, Math.ceil(position * scale))
              var element = `<path fill="white" d="${path}" />`
              paths += element
              broadcastAppend(element)
              refresh()
              position += audioBuffer.duration
              next()
            }, next)
          })
        }, function (err) {
          if (err) {
            onDone && onDone(err)
          } else {
            onDone && onDone(null, obs())
            options.fs.writeFile(svgPath, obs(), function () {
              // done
            })
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
    var x = Math.round(markers[i-1] * scale)
    result += line(x, 0)
  }

  return result + ' Z'
}

function line(x,y) {
  return ' L' + x + ',' + y
}

function getPathForData(data, width, height, x){

  x = x || 0

  width += 1
  var step = Math.ceil( data.length / width )
  var amp = (height / 2)

  var maxValues = []
  var minValues = []

  for(var i=0;i<width;i++){
    var min = 1.0
    var max = -1.0
    var defined = false
    for (j=0; j<step; j++) {
      var datum = data[(i*step)+j]
      if (datum < min){
        min = datum
        defined = true
      }
      if (datum > max){
        max = datum
        defined = true
      }
    }

    if (defined){
      maxValues[i] = max
      minValues[i] = min
    } else {
      maxValues[i] = 0
      minValues[i] = 0
    }

  }

  // top
  var result = 'M ' + (x-1) + ',' + (height/2)
  maxValues.forEach(function(val, i){
    result += ' L' + (i+x) + ',' + Math.round(amp+(val*amp))
  })

  // end point
  result += ' L' + (width+x) + ',' + (height/2)

  // bottom
  minValues.reverse().forEach(function(val,i){
    result += ' L' + (width+x-i-1) + ',' + Math.round(amp+(val*amp))
  })

  return result + ' Z'
}

function forEach (array, fn, cb){
  var i = -1
  function next(err){
    if (err) return cb&&cb(err)
    i += 1
    if (i<array.length){
      fn(array[i], next, i)
    } else {
      cb&&cb(null)
    }
  }
  next()
}
