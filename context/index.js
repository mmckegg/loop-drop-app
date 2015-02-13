var Observ = require('observ')
var watch = require('observ/watch')

var Bopper = require('bopper')
var Project = require('loop-drop-project')
var StreamObserv = require('../lib/stream-observ')
var AudioRMS = require('audio-rms')

///

var audioContext = new AudioContext()

// main output and monitoring
var output = audioContext.createGain()
output.rms = AudioRMS(audioContext)
output.rms.observ = StreamObserv(output.rms)
output.connect(output.rms.input)
output.connect(audioContext.destination)

// main clock
var scheduler = Bopper(audioContext)
var tempo = Observ(120)
watch(tempo, scheduler.setTempo.bind(scheduler))
scheduler.start()

// active project
var project = Project()

module.exports = {

  nodes: {
    setup: require('loop-drop-setup'),
    external: require('loop-drop-project/external'),
    slot: require('./slots.js'),
    controller: require('./controllers.js'),
    chunk: require('./chunks.js'),
    source: require('./sources.js'),
    modulator: require('./modulators.js'),
    processor: require('./processors.js'),

    AudioBuffer: require('loop-drop-project/audio-buffer')
  },

  audio: audioContext,
  scheduler: scheduler,
  output: output,
  project: project,
  tempo: tempo
}