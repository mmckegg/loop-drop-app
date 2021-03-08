var electron = require('electron')
var insertCss = require('insert-css')
var h = require('lib/h')

var fs = require('fs')
var join = require('path').join

var Observ = require('mutant/value')
var Property = require('lib/property')
var watch = require('mutant/watch')
var FileObject = require('lib/file-object')

var noDrop = require('lib/no-drop')
var applyKeyboardTempo = require('lib/keyboard-tempo')
var renderNode = require('lib/render-node')

var MidiStream = require('web-midi')
var PeriodicWaves = require('lib/periodic-waves')
var MidiClockOffset = require('lib/midi-clock-offset')

var version = require('./package.json').version

// apply css styles
insertCss(require('./styles'))
electron.webFrame.setZoomLevelLimits(1, 1)

// audio devices
var audioDevices = Observ([])
audioDevices.output = Observ([])
audioDevices.input = Observ([])
audioDevices.deviceIdLookup = Observ({})

refreshAudioDevices()
navigator.mediaDevices.addEventListener('devicechange', refreshAudioDevices)

function refreshAudioDevices () {
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    audioDevices.set(devices.filter(d => d.kind.startsWith('audio')))
    audioDevices.output.set(devices.filter(d => d.kind === 'audiooutput'))
    audioDevices.input.set(devices.filter(d => d.kind === 'audioinput'))
  })
}

// midi ports
var midiPorts = Observ()
midiPorts.output = Observ()
midiPorts.input = Observ()
midiPorts.open = MidiStream
midiPorts.openInput = MidiStream.openInput
midiPorts.openOutput = MidiStream.openOutput

MidiStream.watchPortNames(function (ports) {
  midiPorts.set(ports)
})

MidiStream.watchPortNames(function (ports) {
  midiPorts.output.set(ports)
}, {outputs: true})

MidiStream.watchPortNames(function (ports) {
  midiPorts.input.set(ports)
}, {inputs: true})

// make sure recording has saved to disk before closing
electron.ipcRenderer.on('close', function () {
  if (window.currentProject && !window.currentProject.isReadyToClose()) {
    window.currentProject.actions.prepareToClose(function () {
      electron.remote.getCurrentWindow().destroy()
    })
  } else {
    electron.remote.getCurrentWindow().destroy()
  }
})

// create root context
var audioContext = new global.AudioContext()

// monkey patch until we upgrade to chrome > 60
audioContext.baseLatency = 1 / audioContext.sampleRate * 256

var heapSize = Observ(0)
setInterval(() => {
  var newValue = Math.round(window.performance.memory.usedJSHeapSize / 1024)
  if (heapSize() !== newValue) {
    heapSize.set(newValue)
  }
}, 1000)

var nodes = require('./nodes')
var rootContext = window.rootContext = {
  fs: fs,
  heapSize,
  audio: audioContext,
  periodicWaves: PeriodicWaves(audioContext),
  midiClockOffset: MidiClockOffset(audioContext),
  midiPorts: midiPorts,
  audioDevices: audioDevices,
  nodes: nodes.objectLookup,
  nodeInfo: nodes,
  zoom: Property(1.1),
  version: version,
  alternateOutputs: [],
  alternateInputs: []
}

function addAlternates(deviceInfos) {
  deviceInfos.forEach(function (device) {
    var miniInfo = { label: device.label, deviceId: device.deviceId }
    if (device.kind === 'audioinput') rootContext.alternateInputs.push(miniInfo)
    if (device.kind === 'audiooutput') rootContext.alternateOutputs.push(miniInfo)
  })
}

navigator.mediaDevices.enumerateDevices().then(addAlternates).catch(function (e) {
  console.log('unable to get any alternate devices', e)
});

watch(rootContext.zoom, function (value) {
  electron.webFrame.setZoomFactor(value || 1)
})

noDrop(document)
require('lib/context-menu')

document.addEventListener('DOMContentLoaded', function (event) {
  electron.ipcRenderer.send('loaded')
})

electron.ipcRenderer.on('load-project', function (e, path) {
  // load project and initialize view

  var projectPath = join(path, 'project.json')
  var projectFile = FileObject(rootContext)

  projectFile.onLoad(function () {
    applyKeyboardTempo(projectFile.node)

    document.documentElement.replaceChild(h('body', [
      renderNode(projectFile.node)
    ]), document.body)

    window.currentProject = projectFile.node
  })

  projectFile.load(projectPath)
})
