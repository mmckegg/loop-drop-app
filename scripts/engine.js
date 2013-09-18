var Engine = require('loop-drop-engine')
var Launchpad = require('midi-looper-launchpad')
var MidiStream = require('web-midi')

var WindowStream = require('window-stream')

////////////////////////////

var audioContext = new webkitAudioContext()

var engine = Engine(audioContext)
var clock = engine.getClock()

// instance A
var instanceA = engine.createInstance('a')
var launchpadA = Launchpad(MidiStream('Launchpad', 0), instanceA.looper)
clock.pipe(launchpadA).pipe(instanceA)

// instance B
var instanceB = engine.createInstance('b')
var launchpadB = Launchpad(MidiStream('Launchpad', 0), instanceB.looper)
clock.pipe(launchpadB).pipe(instanceB)

// connect to UI in parent window
var parentStream = WindowStream(window.parent, '/')
engine.connect(parentStream)

clock.setTempo(120)
clock.start()