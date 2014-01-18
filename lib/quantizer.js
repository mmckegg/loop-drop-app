var Through = require('through')

module.exports = Quantizer

function Quantizer(positionHandler){
  var stream = Through(function(data){
    var position = data[3] != null ? data[3] : positionHandler()
    if (this.grid){
      position = Math.round(position / this.grid) * this.grid
    }
    var newData = data.slice()
    newData[3] = position
    this.queue(newData)
  })
  return stream
}