module.exports = interpolate

function interpolate(event, time){
  var to = event.at + (event.duration||0)
  if (time < event.at){
    return event.fromValue
  } else if (event.duration && time <= to){
    var range = event.value - event.fromValue
    var pos = (time - event.at) / event.duration
    if (event.mode === 'exp'){
      return event.fromValue + (range * (Math.pow(pos, 2)))
    } else if (event.mode === 'log'){
      return event.fromValue + (range * (Math.pow(pos, 1/4)))
    } else {
      return event.fromValue + (range * pos)
    }
  } else {
    return event.value
  }
}