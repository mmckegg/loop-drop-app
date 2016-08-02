var electron = require('electron')
var insertCss = require('insert-css')
var h = require('lib/h')

var fs = require('lib/fs-with-watchers')
var join = require('path').join

var Observ = require('observ')
var Property = require('observ-default')
var watch = require('observ/watch')
var FileObject = require('lib/file-object')

var noDrop = require('lib/no-drop')
var applyKeyboardTempo = require('lib/keyboard-tempo')
var renderNode = require('lib/render-node')

var MidiStream = require('web-midi')
var PeriodicWaves = require('lib/periodic-waves')

// apply css styles
insertCss(require('./styles'))
electron.webFrame.setZoomLevelLimits(1, 1)

// midi ports
var midiPorts = Observ()
midiPorts.open = MidiStream
midiPorts.openInput = MidiStream.openInput
midiPorts.openOutput = MidiStream.openOutput

MidiStream.watchPortNames(function (ports) {
  midiPorts.set(ports)
})

var closing = false
window.onbeforeunload = function (e) {
  // ensure recording is saved on close
  if (!closing && window.currentProject && window.currentProject.actions.prepareToClose) {
    window.currentProject.actions.prepareToClose(function () {
      closing = true
      electron.remote.getCurrentWindow().close()
    })
    return false
  }
}

// create root context
var audioContext = new global.AudioContext()
var nodes = require('./nodes')
var rootContext = window.rootContext = {
  fs: fs,
  audio: audioContext,
  periodicWaves: PeriodicWaves(audioContext),
  midiPorts: midiPorts,
  nodes: nodes.objectLookup,
  nodeInfo: nodes,
  zoom: Property(1.1)
}

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

  ensureProject(projectPath, function (err) {
    if (err) throw err
    projectFile.load(projectPath)
  })
})

function ensureProject (path, cb) {
  rootContext.fs.exists(path, function (exists) {
    if (exists) {
      cb()
    } else {
      rootContext.fs.writeFile(path, JSON.stringify({
        node: 'project'
      }), cb)
    }
  })
}
