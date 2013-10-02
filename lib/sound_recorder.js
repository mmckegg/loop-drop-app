var WaveRecorder = require('wave-recorder')

module.exports = function(launchpad, soundbank){

  var release = []
  var recordLightReleases = {}
  var recordReleases = {}

  var changeStream = soundbank.getChangeStream()

  navigator.webkitPersistentStorage.requestQuota(1024*1024*1024, function(size){
    console.log('Storage:', size)
  })

  var soundRecorder = {
    start: function(){

      // highlight recording
      for (var i=0;i<64;i++){
        var button = launchpad.noteMatrix.getButton([144,i])
        release.push(button.light(launchpad.stateLights.redLow))        
      }

      // grab record buttons
      release.push(launchpad.noteMatrix.grab(function(data){
        if (soundRecorder.recorder){
          var key = data[0] + '/' + data[1]
          if (data[2]){

            var b = launchpad.noteMatrix.getButton(data)
            recordLightReleases[key] = b.light(launchpad.stateLights.red)

            recordReleases[key] = soundRecorder.recorder.record(Date.now()+'.wav', function(err, url){
              changeStream.write({
                id: data[1],
                source: {
                  type: 'sample',
                  url: url
                }
              })
            })

          } else {
            // relase
            recordLightReleases[key] && recordLightReleases[key]()
            recordLightReleases[key] = null

            recordReleases[key] && recordReleases[key]()
            recordReleases[key] = null
          }
        }
      }))

    },
    stop: function(){
      release.forEach(invoke)
      release = []

      // release all lights
      Object.keys(recordLightReleases).forEach(function(key){
        recordLightReleases[key] && recordLightReleases[key]()
      })
      recordLightReleases = {}

      // release all recordings
      Object.keys(recordReleases).forEach(function(key){
        recordReleases[key] && recordReleases[key]()
      })
      recordReleases = {}
    }
  }

  navigator.webkitGetUserMedia({audio:true}, function(stream) {
    soundRecorder.userMediaStream = stream
    var audioInput = soundbank.context.createMediaStreamSource(stream)
    soundRecorder.recorder = WaveRecorder(audioInput)
  })

  return soundRecorder
}


function invoke(func){
  func()
}