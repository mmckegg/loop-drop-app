module.exports = function getSoundOffset(buffer){

  if (!buffer) return

  var threshold = 0.01

  var data = buffer.getChannelData(0)
  var step = 32
  var width = buffer.length / step

  for(var i=0;i<width;i++){
    var min = 1.0
    var max = -1.0
    for (j=0; j<step; j++) {
      var datum = data[(i*step)+j]
      if (datum < min){
        min = datum
      }
      if (datum > max){
        max = datum
      }
    }

    if (Math.max(Math.abs(min), Math.abs(max)) > threshold){
      var value = (i*step) / buffer.length
      return [value, 1]
    }
  }
}