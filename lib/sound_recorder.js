var WaveRecorder = require('wave-recorder')
var fs = require('web-fs')
var EventEmitter = require('events').EventEmitter

module.exports = function(launchpad, soundbank){

  var release = []
  var recordLightReleases = {}
  var streams = {}
  var audioContext = window.context.audio

  var state = false

  var soundRecorder = new EventEmitter() 

  soundRecorder.getState = function(){
    return state
  }

  soundRecorder.connect = function(destination){
    if (soundRecorder.output){
      soundRecorder.output.connect(destination) 
    }
  }

  soundRecorder.start = function(){

    if (!soundRecorder.userMediaStream){
      navigator.webkitGetUserMedia({audio:true}, function(stream) {
        soundRecorder.userMediaStream = stream
        soundRecorder.output = audioContext.createMediaStreamSource(stream)
        soundRecorder.start()
      }, function(err){
        throw err
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
      if (soundRecorder.output){
        var id = String(data[1])
        if (data[2]){
          record(id)
        } else {
          stop(id)
        }
      }
    }))
    state = true
  }

  soundRecorder.stop = function(){
    release.forEach(invoke)
    release = []

    // release all lights
    Object.keys(recordLightReleases).forEach(function(key){
      recordLightReleases[key] && recordLightReleases[key]()
    })
    recordLightReleases = {}

    // release all recordings
    Object.keys(streams).forEach(function(key){
      streams[key] && streams[key].end()
    })
    streams = {}
    
    state = false

    if (soundRecorder.userMediaStream){
      // FOR some reason, when the stream is stopped, it won't restart :(
      //soundRecorder.userMediaStream.stop()
      //soundRecorder.userMediaStream = null
      //soundRecorder.output = null
    }

  }

  return soundRecorder

  function record(id){
    soundRecorder.emit('beginRecord', id)
    var samples = window.context.currentProject.samples

    var b = launchpad.noteMatrix.getButton('144/' + id)
    recordLightReleases[id] = b.light(launchpad.stateLights.red)

    var stream = WaveRecorder(audioContext)
    soundRecorder.connect(stream.input)

    samples.getFile(Date.now() + '-' + id + '.wav', {create: true}, function(file){

      var fileStream = fs.createWriteStream(file)
      stream.pipe(fileStream)
      fileStream.on('close', function(){

        soundRecorder.emit('endRecord', id)

        // load sample, calculate offset, then update slot
        audioContext.loadSample(file.name, function(buffer){
          soundbank.update({
            id: id,
            sources: [{
              node: 'sample',
              mode: 'hold',
              url: file.name,
              offset: getOffset(buffer) || [0,1]
            }],
            gain: 1
          })
        })

      })
    })
    streams[id] = stream
  }

  function stop(id){

    recordLightReleases[id] && recordLightReleases[id]()
    recordLightReleases[id] = null

    if (streams[id]){
      streams[id].end()
      streams[id] = null
    }
  }
}

function getOffset(buffer){

  if (!buffer) return

  var threshold = 0.01

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

    if (Math.max(Math.abs(min), Math.abs(max)) > threshold){
      var value = (i*step) / buffer.length
      return [value, 1]
    }
  }
}

function invoke(func){
  func()
}