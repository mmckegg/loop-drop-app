var Through = require('through')
var h = require('hyperscript')
var KeyStream = require('./lib/key_stream')

// midi source

var MidiStream = require('web-midi')
var QwertyKeys = require('midi-qwerty-keys')
var MidiInput = require('web-midi').openInput
var MidiGrabber = require('./lib/midi_grabber')

var Repeater = require('./lib/repeater')
var Suppressor = require('./lib/suppressor')

// recording and playback
var Bopper = require('bopper')
var Ditty = require('ditty')
var MidiLooper = require('midi-looper')

// behavior
var KitRecorder = require('./lib/kit_recorder')
var wireUpSoundbanks = require('./lib/wire_up_soundbanks')
var handleKey = require('./lib/handle_key')
var tapTempo = require('../tap-tempo')()

// controls
var KitHolder = require('./controls/kit_holder')
var KitLoader = require('./controls/kit_loader')
var SoundEditor = require('./controls/sound_editor')
var Metro = require('./controls/metro')

// devices
var LaunchpadControl = require('midi-looper-launchpad')



////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////



var audioContext = new webkitAudioContext()

var bopper = Bopper(audioContext)
var ditty = Ditty()

bopper.start()
tapTempo.on('tempo', bopper.setTempo)

window.bopper = bopper
window.ditty = ditty

var playback = Through(function(event){
  if (Array.isArray(event)){
    var position = event[3] || bopper.getCurrentPosition()
    event[3] = position
    event = {
      time: audioContext.currentTime,
      data: event,
    }
  }
  this.queue(event)
})

//var midiInput = MidiInput('KeyStudio') 

var qwertyInput = QwertyKeys({mode: 'grid'})
var midiGrabber = MidiGrabber()
var looper = MidiLooper(bopper.getCurrentPosition)

var repeater = Repeater(midiGrabber, looper)
var suppressor = Suppressor(midiGrabber, looper)

var launchpad = LaunchpadControl(MidiStream('Launchpad'), looper)
bopper.pipe(launchpad)

launchpad.pipe(playback)

// capture it!
KeyStream().pipe(qwertyInput)
qwertyInput.pipe(midiGrabber)
//midiInput.pipe(midiGrabber)

// bop it!
bopper.pipe(ditty).pipe(playback)
midiGrabber.pipe(playback)

// record it!
playback.pipe(looper)

// trigger it!
var kitHolder = KitHolder(audioContext)
playback.on('data', kitHolder.trigger)

// play it!
wireUpSoundbanks(audioContext, kitHolder.soundbanks)
looper.on('change', function(playback){
  ditty.setNotes(playback.notes, playback.length)
})

// sample it!
var kitRecorder = KitRecorder(audioContext, kitHolder, midiGrabber)
var kitLoader = KitLoader(kitHolder)
kitLoader.on('record', kitRecorder.record)
kitLoader.on('stopRecord', kitRecorder.stopRecord)

// edit it!
var soundEditor = SoundEditor()
kitHolder.on('selectSound', function(sound){
  soundEditor.edit(sound)
  if (shouldSwitchToActive){
    sound.soundbank.trigger(0, sound.id)
    setTimeout(function(){
      sound.soundbank.triggerOff(0, sound.id)
    },500)
  }
})
midiGrabber.on('data', function(data){
  if (shouldSwitchToActive && data[2]){
    kitHolder.select(data[0] - 144, data[1])
  }
})


// enter = store loop
handleKey(13, function(){
  var length = 16
  looper.store(length, 0.1)
})

// numbers = repeat
handleKey([49, 50, 51, 52, 53, 54, 55, 56], function(e){
  var length = 2 / (e.keyCode - 48)
  repeater.start(length)
})

// ~ = stop repeat
handleKey(192, function(){
  repeater.stop()
})

// backspace = clear loop
handleKey(8, suppressor.start, suppressor.stop)

// shift = switch to note when played
var shouldSwitchToActive = false
handleKey(16, function(){
  shouldSwitchToActive = true
}, function(){
  shouldSwitchToActive = false
})

// - / + = undo redo
handleKey(189, looper.undo)
handleKey(187, looper.redo)

// tap tempo
handleKey(38, tapTempo.tap)

handleKey(37, function(){
  bopper.setSpeed(0.95)
}, function(){
  bopper.setSpeed(1)
})
handleKey(39, function(){
  bopper.setSpeed(1.05)
}, function(){
  bopper.setSpeed(1)
})

handleKey(40, function(){
  bopper.restart(8)
})

// space = play/pause
handleKey(32, function(){
  if (bopper.isPlaying()){
    bopper.stop()
  } else {
    bopper.start()
  }
})

var metro = Metro()
bopper.on('beat', metro.setBeat)
tapTempo.on('tap', metro.flash)


// set up viewport
document.body.appendChild(
  h('div.ViewPort', soundEditor, metro, kitHolder, kitLoader)
)

// state save / restore
var state = require('./lib/persistence')
//state.autoSave(kitHolder, 30000)
state.restore(audioContext, kitHolder)

window.onbeforeunload = function(){
  //window.save(kitHolder)
}

function mergeClone(){
  var result = {}
  for (var i=0;i<arguments.length;i++){
    var obj = arguments[i]
    if (obj){
      Object.keys(obj).forEach(function(key){
        result[key] = obj[key]
      })
    }
  }
  return result
}