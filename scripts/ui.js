var WindowStream = require('window-stream')
var Through = require('through')

var Editor = require('../controls/editor')
var Holder = require('../controls/holder')

var engineWindow = document.getElementById('engineFrame').contentWindow
var engineStream = WindowStream(engineWindow, '/engine.html')


var noteStreamA = Plex(engineStream, 'playback[a]')
var noteStreamB = Plex(engineStream, 'playback[b]')

var clock = Plex(engineStream, 'clock')

var changeStreamA = Plex(engineStream, 'soundbank[a]')
var changeStreamB = Plex(engineStream, 'soundbank[b]')


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
  noteStreamA: noteStreamA, 
  noteStreamB: noteStreamB, 
  soundStreamA: changeStreamA, 
  soundStreamB: changeStreamB
})



holder.kitA.on('select', function(id){
  var sound = soundsA[id]
  if (sound){
    editor.edit(sound)
  }
})

holder.kitB.on('select', function(id){
  var sound = soundsB[id]
  if (sound){
    editor.edit(sound)
  }
})

document.body.appendChild(editor)
document.body.appendChild(holder)


setTimeout(function(){

  for (var i=0;i<32;i++){
    changeStreamA.write({
      id: i, 
      source: {
        type: 'oscillator', 
        pitch: 34+i, 
        shape: 2,
        vibrato: [5,5]
      }, 
      envelope: [0, 0], 
      gain: 0.3,
    })
    holder.kitA.setState(i, 1)
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
