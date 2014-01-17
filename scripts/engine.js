var Bopper = require('bopper')
var Ditty = require('ditty')

var MidiLooper = require('midi-looper')
var Soundbank = require('soundbank')

var MidiStream = require('web-midi')
var Launchpad = require('midi-looper-launchpad')

var SoundRecorder = require('../lib/sound_recorder')

////////////////////////////

var audioContext = new webkitAudioContext()

var clock = Bopper(audioContext)

var instances = {
  'left': createInstance(MidiStream('Launchpad', 0)),
  'right': createInstance(MidiStream('Launchpad', 1))
}

function createInstance(midiStream){
  var instance = Soundbank(audioContext)
  var ditty = Ditty(clock)
  var exclude = {}

  instance.on('change', function(data){
    exclude['144/' + data.id] = data.exclude
  })

  instance.looper = MidiLooper(clock.getCurrentPosition, {exclude: exclude})

  // feedback loop
  ditty.pipe(instance).pipe(instance.looper).pipe(ditty)

  // connect to output
  instance.connect(audioContext.destination)
  return instance
}

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