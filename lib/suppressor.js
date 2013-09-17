module.exports = function(midiGrabber, looper){

  var suppressor = {}

  var release = null
  var releaseTransform = null

  var downNotes = []


  suppressor.start = function(){
    if (!release){
      release = midiGrabber.grab(function(data){
        if (data[2]) down(data)
        else up(data)
      })
    }
  }

  suppressor.stop = function(){
    if (release){
      release()
      release = null
    }
    downNotes = []
    refresh()
  }

  function down(data){
    downNotes.push(data[0] + '/' + data[1])
    refresh()
  }

  function up(data){

  }

  function refresh(){
    if (releaseTransform) {
      releaseTransform()
      releaseTransform = null
    }

    if (downNotes.length){
      releaseTransform = looper.transform('suppress', downNotes)
    }
  }

  return suppressor
}