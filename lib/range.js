module.exports = function(context, descriptor){
  var result = []
  if (Array.isArray(descriptor.notes)){
    for (var i=0;i<descriptor.notes.length;i++){
      result.push('144/' + descriptor.notes[i])
    }
  } else {
    var from = parseInt(descriptor.from) || 0
    var to = parseInt(descriptor.to) || from
    for (var i=from;i<=to;i++){
      result.push('144/' + i)
    }
  }
  return result
}