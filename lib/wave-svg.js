var RangeDecoder = require('audio-buffer-range-decoder')
var Observ = require('observ')
var Event = require('geval')

module.exports = function (path, options, onDone) {
  var svg = Observ()
  var remaining = null
  var position = 0
  var chunkDuration = 2

  var scale = 40
  var height = 100

  var meta = null
  var paths = []
  var markerPath = null

  var decodeRange = null
  var svgPath = path + '.svg'

  var broadcastAppend = null
  svg.onAppendChild = Event(function (broadcast) {
    broadcastAppend = broadcast
  })

  options.fs.readFile(svgPath, 'utf8', function (err, value) {
    if (err) {
      decodeRange = RangeDecoder(path, options, function (err, res) {
        if (err) return onDone && onDone(err)
        meta = res
        remaining = meta.duration
        nextChunk()
      })

      // cue points
      var timePath = path + '.time'
      options.fs.readFile(timePath, function (err, buffer) {
        if (!err) {
          var data = new Float32Array(new Uint8Array(buffer).buffer)
          markerPath = getMarkerPath(data, scale, height)
          refresh()
        }
      })
    } else {
      svg.set(value)
      onDone && onDone(null, value)
    }
  })

  function nextChunk () {
    if (remaining > 0) {
      var duration = Math.min(chunkDuration, remaining)
      decodeRange(position, duration, function (err, audioBuffer) {
        if (err) return onDone && onDone(err)
        var data = audioBuffer.getChannelData(0)
        var path = getPathForData(data, Math.ceil(duration * scale), height, Math.ceil(position * scale))
        paths.push(path)
        broadcastAppend('<path fill="rgb(255,255,255)" d="' + path + '"/>')
        refresh()

        remaining -= duration
        position += duration

        nextChunk()
      })
    } else {
      onDone && onDone(null, svg())
      options.fs.writeFile(svgPath, svg(), function () {
        // done
      })
    }
  }

  function refresh () {
    if (meta) {
      var result = '<svg xmlns="http://www.w3.org/2000/svg" height="' +
                      height + '" width="' + Math.ceil(meta.duration * scale) + '" >'

      paths.forEach(function (path) {
        result += '<path fill="rgb(255,255,255)" d="' + path + '"/>'
      })

      if (markerPath) {
        result += '<path fill="rgba(255,255,255,0.1)" d="' + markerPath + '"/>'
      }

      result += "</svg>"
      svg.set(result)
    }
  }

  return svg
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
