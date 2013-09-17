var path = require('path')
var fs = require('web-fs')

var EventEmitter = require('events').EventEmitter
var loadSound = require('./load_sound')
var WaveRecorder = require('wave-recorder')

module.exports = function(audioContext, kitHolder, noteGrabber){
  var kitRecorder = new EventEmitter()

  var recorder = null

  navigator.webkitPersistentStorage.requestQuota(1024*1024*1024, function(size){
    console.log('Storage:', size)
  })

  navigator.webkitGetUserMedia({audio:true}, function(stream) {
    kitRecorder.userMediaStream = stream
    var audioInput = audioContext.createMediaStreamSource(stream)
    recorder = WaveRecorder(audioInput)
    kitRecorder.recorder = recorder
  })

  kitHolder.on('fileDrop', function(file, kit, soundId){
    var filepath = path.join('', Date.now() + '-' + file.name)
    var stream = fs.createWriteStream(filepath)
    stream.on('close', function(){
      loadSound(stream.url, audioContext, function(err, buffer){
        var sound = {
          buffer: buffer,
          url: stream.url,
          transpose: 0,
          gain: 1
        }        
        kit.soundbank.addSound(soundId, sound)
      })
    })
    stream.write(file)
    stream.end()
  })

  var kitFilters = {
    0: [144, '0...64', null],
    1: [144, '64...128', null],
    2: [145, '0...64', null],
    3: [145, '64...128', null]
  }

  var kitGrabbers = {}
  var kitsRecording = {0:{},1:{},2:{},3:{}}
  kitRecorder.record = function(kitId){
    kitHolder.kits[kitId].classList.add('-recording')
    var stopGrabbing = noteGrabber.grab(kitFilters[kitId], function(data){
      var soundId = data[1] - ((kitId % 2) * 64)
      if (data[2]){
        record(kitId, soundId)
      } else {
        stopRecord(kitId, soundId)
      }
    })
    kitGrabbers[kitId] = stopGrabbing
  }

  kitRecorder.stopRecord = function(kitId){
    kitHolder.kits[kitId].classList.remove('-recording')
    if (kitGrabbers[kitId]){
      kitGrabbers[kitId]()
      var stillRecording = kitsRecording[kitId]
      Object.keys(stillRecording).forEach(function(soundId){
        stopRecord(kitId, soundId)
      })
    }
  }

  function record(kitId, soundId){
    var kit = kitHolder.kits[kitId]
    var filepath = path.join('', Date.now() + '.wav')
    kit.markRecording(soundId)
    kitsRecording[kitId][soundId] = recorder.record(
      filepath, function(err, url){
        loadSound(url, audioContext, function(err, buffer){
          var sound = {
            buffer: buffer,
            url: url,
            transpose: 0,
            gain: 1
          }        
          kit.soundbank.addSound(soundId, sound)
        })
      }
    )
  }

  function stopRecord(kitId, soundId){
    var kit = kitHolder.kits[kitId]
    kit.unmarkRecording(soundId)
    if (kitsRecording[kitId][soundId]){
      kitsRecording[kitId][soundId].stop()
      kitsRecording[kitId][soundId] = null
    }
  }

  return kitRecorder

}