var Bopper = require('bopper')
var Ditty = require('ditty')

var MidiLooper = require('midi-looper')
var Soundbank = require('soundbank')

var Quantizer = require('../lib/quantizer')

var Launchpad = require('midi-looper-launchpad')
var MidiStream = require('web-midi')
var SoundRecorder = require('../lib/sound_recorder')

var MultiRecorder = require('../lib/multi-recorder')
var AudioRMS = require('../lib/audio-rms')

module.exports = function(body){
  var audioContext = window.context.audio
  var clock = Bopper(audioContext)

  var output = audioContext.createGain()
  output.connect(audioContext.destination)

  var rms = window.context.audio.rms = AudioRMS(audioContext)
  output.connect(rms.input)

  var instances = {
    left: createInstance(audioContext, output, clock, MidiStream('Launchpad', 0)),
    right: createInstance(audioContext, output, clock, MidiStream('Launchpad', 1))
  }

  // start clock
  clock.setTempo(120)
  clock.start()

  chrome.storage.local.get('tempo', function(items) {
    clock.setTempo(items.tempo || 120)
    clock.on('tempo', function(value){
      console.log('saving tempo')
      chrome.storage.local.set({'tempo': value})
    })
  })

  // self recorder
  var instanceNames = Object.keys(instances)
  window.context.recorder = new MultiRecorder(audioContext, instanceNames.length, {silenceDuration: 3})
  instanceNames.forEach(function(name, i){
    instances[name].connect(window.context.recorder.inputs[i])
  })

  window.context.instances = instances
  window.context.clock = clock

  Object.keys(instances).forEach(function(deckId){
    instances[deckId].sampler.on('beginRecord', function(slotId){
      window.events.emit('beginRecordSlot', deckId, slotId)
    }).on('endRecord', function(slotId){
      window.events.emit('endRecordSlot', deckId, slotId)
      window.events.emit('kitChange', deckId)
    })
  })

  window.events.on('startSampling', function(deckId){
    instances[deckId].sampler.start()
  }).on('stopSampling', function(deckId){
    instances[deckId].sampler.stop()
  })

  window.events.on('changeAutoQuantize', function(deckId, value){
    if (value === true){
      instances[deckId].quantizer.grid = 1/4
    } else if (typeof value === 'number') {
      instances[deckId].quantizer.grid = value
    } else {
      instances[deckId].quantizer.grid = null
    }
  })

  console.log('init engine')
}


function getDecibels(value) {
  if (value == null) return 0
  return Math.round(Math.round(20 * (0.43429 * Math.log(value)) * 100) / 100 * 100) / 100
}

module.exports.vu = function(container){
  var rms = window.context.audio.rms
  var vuL = container.querySelector('meter.\\.left')
  var vuR = container.querySelector('meter.\\.right')
  rms.on('data', function(data){
    vuL.value = Math.max(-40, getDecibels(data[0]))
    vuR.value = Math.max(-40, getDecibels(data[1]))
  })

}

var paramFormatters = require('../lib/param_formatters')

module.exports.tempo = function(container){

  var formatter = paramFormatters['bpm']

  var slider = container.querySelector('div')
  var label = container.querySelector('span.\\.label')

  window.context.clock.on('tempo', refresh)


  function refresh(){
    var value = window.context.clock.getTempo()
    slider.style.width = Math.min(1, formatter.size(value)) * 100 + '%'
    label.innerText = formatter.display(value)
  }

  container.addEventListener('mousedown', handleDown)

  function handleDown(e){
    range = container.getBoundingClientRect().width
    startValue = window.context.clock.getTempo()
    lastValue = startValue
    startCoords = [e.screenX, e.screenY]

    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleUp)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  function handleUp(e){
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleUp)
  }

  function handleMove(e){
    var offsetY = Math.abs(e.screenY - startCoords[1])
    var offsetX = (e.screenX - startCoords[0]) / (range + offsetY)
    var value = formatter.value(offsetX, startValue)
    if (value != lastValue && !isNaN(value)){
      setValue(value)
      lastValue = value
    }
  }

  function setValue(value){
    window.context.clock.setTempo(value)
  }

  refresh()
}



function createInstance(audioContext, output, clock, midiStream){
  var instance = Soundbank(audioContext)
  var ditty = Ditty(clock)

  midiStream.on('error', function(err){
    console.log(err)
  })

  var exclude = {}
  instance.on('change', function(data){
    exclude['144/' + data.id] = data.exclude
  })

  instance.looper = MidiLooper(clock.getCurrentPosition, {exclude: exclude})

  // controller
  instance.controller = Launchpad(midiStream, instance.looper)
  instance.quantizer = Quantizer(clock.getCurrentPosition)

  clock.pipe(instance.controller).pipe(instance.quantizer).pipe(instance)

  instance.sampler = SoundRecorder(instance.controller, instance)

  // feedback loop
  ditty.pipe(instance).pipe(instance.looper).pipe(ditty)

  // connect to output
  instance.connect(output)
  return instance
}