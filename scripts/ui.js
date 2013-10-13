var WindowStream = require('window-stream')
var Through = require('through')

var Editor = require('../controls/editor')
var Holder = require('../controls/holder')
var Metro = require('../controls/metro')

var engineWindow = document.getElementById('engineFrame').contentWindow
var engineStream = WindowStream(engineWindow, '/engine.html')


var noteStreamA = Plex(engineStream, 'playback[a]')
var noteStreamB = Plex(engineStream, 'playback[b]')

var clock = Plex(engineStream, 'clock')

var changeStreamA = Plex(engineStream, 'soundbank[a]')
var changeStreamB = Plex(engineStream, 'soundbank[b]')

var beatStream = Plex(engineStream, 'beat')
var commandStream = Plex(engineStream, 'commands')


var soundsA = {}
var soundsB = {}

changeStreamA.on('data', function(data){
  soundsA[data.id] = data
})

changeStreamB.on('data', function(data){
  soundsB[data.id] = data
})

var editor = Editor()

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


holder.kitA.on('select', function(id){
  var sound = soundsA[id]
  if (sound){
    editor.edit(sound, changeStreamA)
  }
})

holder.kitB.on('select', function(id){
  var sound = soundsB[id]
  if (sound){
    editor.edit(sound, changeStreamB)
  }
})

document.body.appendChild(editor)
document.body.appendChild(metro)
document.body.appendChild(holder)

setTimeout(function(){

  for (var i=0;i<64;i++){
    changeStreamB.write({
      id: i, 
      source: {
        type: 'oscillator', 
        pitch: 34+i, 
        shape: 2,
        vibrato: [5,5]
      }, 
      envelope: [0, 0], 
      gain: 0.2,
    })
  }

}, 200)





window.changeStream = changeStreamA



function Plex(stream, channel){
  var result = Through(function(data){
    stream.write(JSON.stringify({channel: result.channel, data: data}))
  })
  result.channel = channel
  stream.on('data', function(data){
    var object = null

    try {
      object = JSON.parse(data)
    } catch (ex){}

    if (object && object.channel == result.channel){
      result.queue(object.data)
    }
  })
  return result
}
