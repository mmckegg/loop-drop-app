var h = require('create-element')
var blackNotes = [1,3,6,8,10]

module.exports = function(context){

  var root = context.get(':root')
  var scale = context.get(':scaleNotes') || []

  var result = ''
  for (var n=24;n<=96;n++){

    var classes = []
    var id = n % 12
    if (~blackNotes.indexOf(id)){
      classes.push('-black')
    }

    if (~scale.indexOf(id)){
      classes.push('-scale')
    }

    if (n == root){
      classes.push('-selected')
    }

    result += h('div', {'class': classes.join(' '), 'data-value': n })
  }
  return result
}