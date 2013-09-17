var Through = require('through')

var lights = {
  green: 127,
  off: 0
}

module.exports = function(midiPort){

  var control = Through(function(event){
    var data = event.data
    if (data[0] == 144){
      var coords = getCoordsFromNote(data[1])
      if (data[2]){
        triggerOn(coords)
      } else {
        triggerOff(coords)
      }
    }
  })

  midiPort.on('data', function(data){
    if (data[0] == 144){
      var coords = getCoordsFromId(data[1])
      if (coords[0] < 8){
        var noteId = noteFromCoords(coords)
        // midi note
        control.queue([144, noteId, data[2]])
      }
    }
  })

  function triggerOn(coords){
    midiPort.write([144, identifierFromCoords(coords), lights.green])
  }

  function triggerOff(coords){
    midiPort.write([144, identifierFromCoords(coords), lights.off])
  }

  return control
}

function getCoordsFromId(identifier){
  var row = Math.floor(identifier / 16)
  var col = identifier % 16
  return [col, row]
}

function getCoordsFromNote(note){
  var row = Math.floor(note / 8)
  var col = note % 8
  return [col, row]
}

function identifierFromCoords(coords){
  return (coords[1] * 16) + coords[0]
}

function noteFromCoords(coords){
  return (coords[1] * 8) + coords[0]
}