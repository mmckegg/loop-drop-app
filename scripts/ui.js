var WindowStream = require('window-stream')
var Through = require('through')

var Holder = require('../controls/holder')
var Metro = require('../controls/metro')

var tapTempo = require('tap-tempo')()
var handleKey = require('../lib/handle-key')
var RemoteStream = require('../lib/remote_stream')

var engineStream = RemoteStream()

var noteStreamA = Plex(engineStream, 'playback[a]')
var noteStreamB = Plex(engineStream, 'playback[b]')

var clock = Plex(engineStream, 'clock')

var changeStreamA = Plex(engineStream, 'soundbank[a]')
var changeStreamB = Plex(engineStream, 'soundbank[b]')

var beatStream = Plex(engineStream, 'beat')
var commandStream = Plex(engineStream, 'commands')

var holder = Holder({
  notesA: noteStreamA, 
  notesB: noteStreamB, 
  soundsA: changeStreamA, 
  soundsB: changeStreamB,
  commands: commandStream,
  beats: beatStream,
  clock: clock
})

var metro = Metro()
beatStream.on('data', metro.setBeat)
tapTempo.on('tap', metro.flash)
tapTempo.on('tempo', function(tempo){
  commandStream.write({command: 'clock', tempo: tempo})
})

// tap tempo
handleKey(38, tapTempo.tap)

handleKey(37, function(){
  commandStream.write({command: 'clock', speed: 0.95})
}, function(){
  commandStream.write({command: 'clock', speed: 1})
})

handleKey(39, function(){
  commandStream.write({command: 'clock', speed: 1.05})
}, function(){
  commandStream.write({command: 'clock', speed: 1})
})

handleKey(40, function(){
  commandStream.write({command: 'clock', restart: true})
})

// space = play/pause
handleKey(32, function(){
  commandStream.write({command: 'clock', toggle: true})
})

document.body.appendChild(metro)
document.body.appendChild(holder)

module.exports = engineStream.remote