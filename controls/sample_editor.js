var WaveView = require('wave-view')

var h = require('hyperscript')
var ever = require('ever')


module.exports = function(sound, changeStream){

  var waveView = WaveView()
  var offset = sound.source.offset || [0,1]

  var startSlider = h('input', {
    className: '.start',
    type: 'range', 
    min: 0, max: 1,
    step: 0.00125
  })

  var endSlider = h('input', {
    className: '.end',
    type: 'range', 
    min: 0, max: 1,
    step: 0.00125
  })

  startSlider.value = offset[0]
  endSlider.value = offset[1]

  waveView.setOffset(sound.source.offset || [0,1])

  startSlider.onchange = updateOffset
  endSlider.onchange = updateOffset

  function updateOffset(){
    var offset = [parseFloat(startSlider.value), parseFloat(endSlider.value)]
    sound.source.offset = offset
    changeStream.write(sound)

    waveView.setOffset(offset)
  }

  var editor = h('div.SampleEditor', waveView, startSlider, endSlider)

  loadSample(sound.source.url, function(err, buffer){
    waveView.setValue(buffer)
  })

  return editor

}

function loadSample(url, cb){
  readFileArrayBuffer(url, function(err, data){  if(err)return cb&&cb(err)
    new webkitAudioContext().decodeAudioData(data, function(buffer){
      cb(null, buffer)
    }, function(err){
      cb(err)
    })
  })
}

function readFileArrayBuffer(url, cb){
  var request = new window.XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = function() {
    cb(null, request.response)
  }
  request.onerror = cb
  request.send();
}