var Bopper = require('bopper')
var Ditty = require('ditty')

var MidiLooper = require('midi-looper')
var Soundbank = require('soundbank')

var Quantizer = require('../lib/quantizer')

var Launchpad = require('midi-looper-launchpad')
var MidiStream = require('web-midi')
var SoundRecorder = require('../lib/sound_recorder')

module.exports = function(body){
  var audioContext = window.context.audio
  var clock = Bopper(audioContext)

  var instances = {
    left: createInstance(audioContext, clock, MidiStream('Launchpad', 0)),
    right: createInstance(audioContext, clock, MidiStream('Launchpad', 1))
  }

  // start clock
  clock.setTempo(120)
  clock.start()


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



function createInstance(audioContext, clock, midiStream){
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
  clock.pipe(instance.controller).pipe(instance)

  instance.sampler = SoundRecorder(instance.controller, instance)

  // feedback loop
  ditty.pipe(instance).pipe(instance.looper).pipe(ditty)

  // connect to output
  instance.connect(audioContext.destination)
  return instance
}