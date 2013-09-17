module.exports = function(midiGrabber, looper){

  var repeater = {}

  var release = null
  var releaseTransform = null

  var downNotes = []
  var repeatLength = 1

  repeater.setLength = function(value){
    repeatLength = value
    refresh()
  }

  repeater.start = function(length){
    if (!release){
      release = midiGrabber.grab(function(data){
        if (data[2]) down(data)
        else up(data)
      })
    }
    if (length){
      repeater.setLength(length)
    }
  }

  repeater.stop = function(){
    if (release){
      release()
      release = null
    }
  }

  function down(data){
    downNotes.push(data)
    refresh()
  }

  function up(data){
    downNotes = downNotes.filter(function(note){
      return !(note[0] == data[0] && note[1] == data[1])
    })
    refresh()
  }

  function refresh(){
    if (releaseTransform) {
      releaseTransform()
      releaseTransform = null
    }

    if (downNotes.length && repeatLength){
      releaseTransform = looper.transform('repeat', downNotes, repeatLength)
    }
  }

  return repeater
}