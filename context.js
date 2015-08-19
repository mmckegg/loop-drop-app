var Observ = require('observ')
var ObservVarhash = require('observ-varhash')
var watch = require('observ/watch')
var fs = require('fs')

var Bopper = require('bopper')
var PeriodicWaves = require('lib/periodic-waves')
var Project = require('loop-drop-project')
var StreamObserv = require('lib/stream-observ')
var AudioRMS = require('audio-rms')
var watchKeyboardLayout = require('lib/watch-keyboard-layout')
var nodes = require('./nodes')

var audioContext = new AudioContext()

// main output and monitoring
var output = audioContext.createDynamicsCompressor()
output.ratio.value = 20
output.threshold.value = -1

output.rms = AudioRMS(audioContext)
output.rms.observ = StreamObserv(output.rms)
output.connect(output.rms.input)
output.connect(audioContext.destination)

// keyboard layout
var keyboardLayout = Observ()
keyboardLayout(function(value) { console.log('Keyboard: ' + value) })
watchKeyboardLayout(keyboardLayout.set)

// main clock
var scheduler = Bopper(audioContext)
var tempo = Observ(120)
var swing = Observ(0)
var speed = Observ(1)

watch(tempo, scheduler.setTempo.bind(scheduler))
watch(speed, scheduler.setSpeed.bind(scheduler))

scheduler.start()

// active project
var project = Project()

module.exports = {
  fs: fs,
  audio: audioContext,
  scheduler: scheduler,
  nodes: nodes.objectLookup,
  nodeInfo: nodes,
  periodicWaves: PeriodicWaves(audioContext),
  output: output,
  project: project,
  tempo: tempo,
  swing: swing,
  speed: speed,
  keyboardLayout: keyboardLayout,
  paramLookup: ObservVarhash({}),
  renaming: Observ()
}