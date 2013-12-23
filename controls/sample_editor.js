var WaveView = require('wave-view')

var h = require('hyperscript')
var ever = require('ever')

var Knob = require('knob')


module.exports = function(sound, changeStream){

  var source = sound.sources[0]

  var waveView = WaveView()
  var disableRefresh = false

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

  var transposeKnob = Knob({
    value: 0,
    label: 'transpose',
    cursor: 20, angleOffset: -125, angleArc: 250,
    min: -24, max: 24,
    fgColor: '#FFF', bgColor: '#222',
    labelColor: '#EEE',
    width: 130,
    height: 110,
    className: '.transpose',
    activeClass: '-active'
  })

  var gainKnob = Knob({
    value: 0,
    label: 'gain (dB)',
    angleOffset: -125, angleArc: 250,
    min: -40, max: 20,
    fgColor: '#FFF', bgColor: '#222',
    labelColor: '#EEE',
    width: 130,
    height: 110,
    className: '.gain',
    activeClass: '-active'
  })

  function handleData(data){
    if (data.id == sound.id){

      var newSource = data.sources[0]

      if (source && newSource && source.url != newSource.url){
        setWave(newSource.url)
      }

      sound = data
      source = newSource

      refresh()
    }
  }

  changeStream.on('data', handleData)

  function refresh(){
    if (!disableRefresh){

      var offset = source.offset || [0,1]
      startSlider.value = offset[0]
      endSlider.value = offset[1]
      transposeKnob.setValue(source.transpose || 0)
      gainKnob.setValue(getDecibels(sound.gain))

      waveView.setOffset(source.offset || [0,1])
      waveView.setGain(sound.gain)

    }
  }

  startSlider.onchange = updateOffset
  endSlider.onchange = updateOffset

  function updateOffset(){
    var offset = [parseFloat(startSlider.value), parseFloat(endSlider.value)]
    source.offset = offset
    save()

    waveView.setOffset(offset)
  }

  transposeKnob.onchange = function(){
    source.transpose = this.value
    save()
  }

  gainKnob.onchange = function(){
    sound.gain = getGain(this.value)
    waveView.setGain(sound.gain)
    save()
  }



  var disableRefreshTimer = null
  function save(){

    // disable refreshing while change being made
    disableRefresh = true
    clearTimeout(disableRefreshTimer)
    disableRefreshTimer = setTimeout(function(){
      disableRefresh = false
      refresh()
    }, 400)

    changeStream.write(sound)
  }

  var editor = h('div.SampleEditor', waveView, startSlider, endSlider, transposeKnob, gainKnob)

  function setWave(url){
    loadSample(url, function(err, buffer){
      waveView.setValue(buffer)
    })
  }

  refresh()
  setWave(source.url)

  editor.destroy = function(){
    changeStream.removeListener('data', handleData)
  }

  return editor

}

function getGain(value) {
  if (value <= -40){
    return 0
  }
  return Math.round(Math.exp(value / 8.6858) * 1000) / 1000
}

function getDecibels(value) {
  if (value == null) return 0
  return Math.round(Math.round(20 * (0.43429 * Math.log(value)) * 100) / 100)
}

function loadSample(url, cb){
  
  if (!/^(([a-z0-9\-]+)?:)|\//.test(url)){
    url = 'filesystem:' + window.location.origin + '/persistent/' + url
  }

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