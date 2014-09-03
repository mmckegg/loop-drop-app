var WaveRecorder = require('wave-recorder')
var fs = require('web-fs')
var EventEmitter = require('events').EventEmitter
var stateLights = require('loop-launchpad/state-lights')
var getSoundOffset = require('./get_sound_offset')
var ObservGrid = require('observ-grid')

module.exports = function(launchpad){

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

    var grid = launchpad.grid()
    var output = ObservGrid([], grid.shape, grid.stride)
    release.push(
      launchpad.controllerGrid.output.push(output),
      launchpad.controllerGrid.inputGrabber(function(input){
        if (input._diff){
          input._diff.forEach(change)
        }
      })
    )

    // highlight recording
    output.data.transaction(function(rawList){
      for (var i=0;i<64;i++){
        rawList[i] = stateLights.redLow  
      }
    })

    function change(diff){
      if (soundRecorder.output){
        var id = String(grid.index(diff[0], diff[1]))
        if (diff[2]){
          record(id)
          output.set(diff[0], diff[1], stateLights.red)
        } else {
          stop(id)
          output.set(diff[0], diff[1], stateLights.redLow)
        }
      }
    }

    state = true
  }

  soundRecorder.stop = function(){
    release.forEach(invoke)
    release = []

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

    var stream = WaveRecorder(audioContext)
    soundRecorder.connect(stream.input)

    samples.getFile(Date.now() + '-' + id + '.wav', {create: true}, function(file){

      var fileStream = fs.createWriteStream(file)
      stream.pipe(fileStream)
      fileStream.on('close', function(){

        soundRecorder.emit('endRecord', id)

        // load sample, calculate offset, then update slot
        audioContext.loadSample(file.name, function(buffer){
          launchpad.mainChunk.update({
            id: id,
            sources: [{
              node: 'sample',
              mode: 'hold',
              url: file.name,
              offset: getSoundOffset(buffer) || [0,1]
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

function invoke(func){
  func()
}