var Engine = require('loop-drop-engine')
var Launchpad = require('midi-looper-launchpad')
var MidiStream = require('web-midi')
//var SoundRecorder = require('../../lib/sound_recorder')

module.exports = function(body){
  console.log('init engine')
  var audioContext = window.context.audio
  var engine = Engine(audioContext)
  var clock = engine.getClock()

  var midiStreams = [
    MidiStream('Launchpad', 0),
    MidiStream('Launchpad', 1)
  ]

  midiStreams[0].on('error', function(err){
    console.log(err)
  })

  midiStreams[1].on('error', function(err){
    console.log(err)
  })

  // left deck
  var instanceA = engine.createInstance('left')
  var launchpadA = Launchpad(midiStreams[0], instanceA.looper)
  //var soundRecorderA = SoundRecorder(launchpadA, instanceA)
  clock.pipe(launchpadA).pipe(instanceA)

  // right deck
  var instanceB = engine.createInstance('right')
  var launchpadB = Launchpad(midiStreams[1], instanceB.looper)
  //var soundRecorderB = SoundRecorder(launchpadB, instanceB)
  clock.pipe(launchpadB).pipe(instanceB)

  // start clock
  clock.setTempo(120)
  clock.start()

  window.context.engine = engine
  window.context.clock = clock
  window.context.decks = {
    left: instanceA,
    right: instanceB
  }

  // default data
  instanceA.update({
    id: "0",
    offset: 0,
    sources: [
      {
        type: 'oscillator',
        shape: 1,
        note: {$: '34+offset'},
        amp: { value: 0.4, type: 'adsr', decay: 0.1, sustain: 0.5, release: 1}
      }
    ]
  })
}