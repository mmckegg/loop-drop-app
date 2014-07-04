var Bopper = require('bopper')
var Ditty = require('ditty')

var MidiLooper = require('midi-looper')
var Soundbank = require('soundbank')

var Playback = require('../lib/playback')
var Quantizer = require('../lib/quantizer')

var Launchpad = require('midi-looper-launchpad')
var MidiStream = require('web-midi')
var SoundRecorder = require('../lib/sound_recorder')

var MultiRecorder = require('../lib/multi-recorder')
var AudioRMS = require('../lib/audio-rms')

module.exports = function(body){
  var audioContext = window.context.audio

  var clock = Bopper(audioContext)
  audioContext.scheduler = clock

  var output = audioContext.createGain()
  output.connect(audioContext.destination)

  // debug write out levels to console
  var monitorId = 0
  window.monitorLevel = function(name, node){
    var id = monitorId++
    var monitor = AudioRMS(audioContext)
    node.connect(monitor.input)
    monitor.on('data', function(data){
      console.log(id, name, data[0])
    })
  }

  var rms = window.context.audio.rms = AudioRMS(audioContext)
  output.connect(rms.input)

  var instances = {
    left: createInstance(audioContext, output, MidiStream('Launchpad', 0)),
    right: createInstance(audioContext, output, MidiStream('Launchpad', 1))
  }

  // start clock
  clock.setTempo(120)
  clock.start()

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

function createInstance(audioContext, output, midiStream){

  var instance = Soundbank(audioContext)

  instance.playback = Playback(instance)
  
  var scheduler = audioContext.scheduler
  var ditty = Ditty(scheduler)

  midiStream.on('error', function(err){
    console.log(err)
  })

  var exclude = {}
  var noRepeat = {}
  instance.on('change', function(data){
    exclude['144/' + data.id] = data.exclude
    noRepeat['144/' + data.id] = data.noRepeat
  })

  instance.looper = MidiLooper(scheduler.getCurrentPosition, {exclude: exclude, noRepeat: noRepeat})

  // controller
  instance.controller = Launchpad(midiStream, instance.looper)
  instance.quantizer = Quantizer(scheduler.getCurrentPosition)
  scheduler.pipe(instance.controller).pipe(instance.quantizer).pipe(instance.playback)

  // sampler
  instance.sampler = SoundRecorder(instance.controller, instance)

  // feedback loop
  ditty.pipe(instance.playback).pipe(instance.looper).pipe(ditty)

  // connect to output
  instance.connect(output)
  return instance
}