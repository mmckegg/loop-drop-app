var Ditty = require('ditty')
var Soundbank = require('soundbank')
var MidiStream = require('web-midi')
var MultiRecorder = require('../lib/multi-recorder')
var AudioRMS = require('audio-rms')

var Trigger = require('soundbank-trigger')
var LaunchpadLooper = require('loop-launchpad')
var Chunk = require('soundbank-chunk')
var Recorder = require('loop-recorder')
var Sampler = require('../lib/sampler')

module.exports = function(body){
  var audioContext = window.context.audio

  var clock = window.context.clock = audioContext.scheduler
  var output = audioContext.createGain()
  output.connect(audioContext.destination)

  var soundbank = window.context.soundbank = Soundbank(audioContext)
  soundbank.connect(output)

  var triggerOutput = window.context.triggerOutput = Trigger(soundbank)
  var player = window.context.player = Ditty()

  var recorder = Recorder()

  clock
    .pipe(player)
    .pipe(triggerOutput)
    .pipe(recorder)

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

  var instances = window.context.instances = {
    left: createInstance({
      id: 'left',
      soundbank: soundbank, 
      midi: MidiStream('Launchpad Mini', 0),
      player: player,
      recorder: recorder,
      triggerOutput: triggerOutput,
      scheduler: clock
    }),
    right: createInstance({
      id: 'right',
      soundbank: soundbank, 
      midi: MidiStream('Launchpad Mini 2', 0),
      player: player,
      recorder: recorder,
      triggerOutput: triggerOutput,
      scheduler: clock
    })
  }

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

  console.log('init engine')
}

function createInstance(opt){

  // use the new modules in the old UI
  var instance = LaunchpadLooper(opt)
  var chunk = Chunk(opt.soundbank, {
    id: opt.id,
    sounds: sixtyfour(),
    shape: [8,8],
    stride: [8, 1]
  })

  instance.sampler = Sampler(instance)
  instance.mainChunk = chunk
  instance.add(chunk, 0, 0)

  opt.midi.on('error', function(err){
    console.error(err)
  })

  return instance
}

function sixtyfour(){
  var result = []
  for (var i=0;i<64;i++){
    result.push(String(i))
  }
  return result
}