var RangeDecoder = require('audio-buffer-range-decoder')
var Observ = require('observ')

module.exports = function (path, options, onDone) {
  var svg = Observ()
  var remaining = null
  var position = 0
  var chunkDuration = 2

  var scale = 40
  var height = 100

  var meta = null
  var paths = []

  var decodeRange = RangeDecoder(path, options, function (err, res) {
    if (err) return onDone && onDone(err)
    meta = res
    remaining = meta.duration
    nextChunk()
  })

  return svg

  function nextChunk () {
    var duration = Math.min(chunkDuration, remaining)
    decodeRange(position, duration, function (err, audioBuffer) {
      if (err) return onDone && onDone(err)
      var data = audioBuffer.getChannelData(0)
      var path = getPathForData(data, Math.ceil(duration * scale), height, Math.ceil(position * scale))
      paths.push(path)
      refresh()

      remaining -= duration
      position += duration

      if (remaining > 0) {
        nextChunk()
      } else {
        onDone && onDone(null, svg())
      }

    })
  }

  function refresh () {
    var result = '<svg xmlns="http://www.w3.org/2000/svg" height="' + 
                    height + '" width="' + Math.ceil(meta.duration * scale) + '" >'
    
    paths.forEach(function (path) {
      result += '<path d="' + path + '"/>'
    })

    result += "</svg>"
    svg.set(result)
  }

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