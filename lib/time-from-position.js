var defaultTime = { 
  tempo: 120, 
  beatDuration: 0.5, 
  position: 0, 
  at: 0 
}

module.exports = getTimeFromPosition

function getTimeFromPosition(position, mapping) {
  var item = defaultTime

  if (mapping) {
    for (var i = 0; i < mapping.length; i++) {
      if (position > mapping[i].position) {
        item = mapping[i]
      } else {
        break
      }
    }
  }

  var difference = position - item.position
  return item.at + difference * item.beatDuration
}