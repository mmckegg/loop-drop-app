var Engine = require('loop-drop-engine')
var Launchpad = require('midi-looper-launchpad')
var MidiStream = require('web-midi')

var SoundRecorder = require('../lib/sound_recorder')

var WindowStream = require('window-stream')

////////////////////////////

var audioContext = new webkitAudioContext()

var engine = Engine(audioContext)
var clock = engine.getClock()

// instance A
var instanceA = engine.createInstance('left')
var launchpadA = Launchpad(MidiStream('Launchpad', 0), instanceA.looper)
var soundRecorderA = SoundRecorder(launchpadA, instanceA)

clock.pipe(launchpadA).pipe(instanceA)

// instance B
var instanceB = engine.createInstance('right')
var launchpadB = Launchpad(MidiStream('Launchpad', 1), instanceB.looper)
var soundRecorderB = SoundRecorder(launchpadB, instanceB)

clock.pipe(launchpadB).pipe(instanceB)

clock.setTempo(120)
clock.start()

engine.handleCommand('clock', function(command){
  if (command.tempo){
    clock.setTempo(command.tempo)
  }

  if (command.restart){
    clock.restart(8)
  }

  if (command.toggle){
    if (clock.isPlaying()){
      clock.stop()
    } else {
      clock.start()
    }
  }

  if (command.start){
    clock.start()
  } else if (command.stop){
    clock.stop()
  }
})

engine.handleCommand('toggleRecord', function(command){
  if (command.deck == 'left'){
    if (soundRecorderA.getState()){
      soundRecorderA.stop()
    } else {
      soundRecorderA.start()
    }
  } else if (command.deck == 'right'){
    if (soundRecorderA.getState()){
      soundRecorderB.stop()
    } else {
      soundRecorderB.start()
    }
  }
})

module.exports = engine