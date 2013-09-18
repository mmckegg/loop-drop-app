var WindowStream = require('window-stream')
var Through = require('through')

var engineWindow = document.getElementById('engineFrame').contentWindow
var engineStream = WindowStream(engineWindow, '/engine.html')


var noteStreamA = Plex(engineStream, 'playback[a]')
var noteStreamB = Plex(engineStream, 'playback[b]')

var clock = Plex(engineStream, 'clock')

noteStreamA.on('data', function(data){
  console.log('NOTE', data)
})





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
