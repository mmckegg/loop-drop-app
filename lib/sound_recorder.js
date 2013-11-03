var WaveRecorder = require('wave-recorder')

module.exports = function(launchpad, soundbank){

  var release = []
  var recordLightReleases = {}
  var recordReleases = {}

  var state = false

  var changeStream = soundbank.getChangeStream()

  navigator.webkitPersistentStorage.requestQuota(1024*1024*1024, function(size){
    console.log('Storage:', size)
  })

  var soundRecorder = {

    getState: function(){
      return state
    },

    start: function(){

      if (!soundRecorder.recorder){
        navigator.webkitGetUserMedia({audio:true}, function(stream) {
          soundRecorder.userMediaStream = stream
          var audioInput = soundbank.context.createMediaStreamSource(stream)
          soundRecorder.recorder = WaveRecorder(audioInput)
          soundRecorder.start()
        })
        return false
      }

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

              url = getUrl(url)

              soundbank.loadSample(url, function(err, buffer){
                changeStream.write({
                  id: data[1],
                  source: {
                    type: 'sample',
                    mode: 'hold',
                    url: url,
                    offset: getOffset(buffer) || [0,1]
                  },
                  gain: 1
                })
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
      state = true
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
      
      state = false

      soundRecorder.userMediaStream.stop()
      soundRecorder.userMediaStream = null
      soundRecorder.recorder = null
    }
  }

  return soundRecorder
}

function getUrl(url){
  var start = 'filesystem:' + window.location.origin + '/persistent/'
  if (url.slice(0,start.length) == start){
    return url.slice(start.length)
  }
}

function getOffset(buffer){

  if (!buffer) return

  var threshold = 0.001

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

    if (max - min > threshold){
      var value = (i*step) / buffer.length
      return [value, 1]
    }
  }
}

function getBuffer(url, cb){
  var sampleCache = audioContext.sampleCache = audioContext.sampleCache || {}
  soundbank.loadSample(url, audioContext, function(err, audioData){
    sampleCache[url] = audioData
    cb&&cb(err, audioData)
  })
}

function invoke(func){
  func()
}