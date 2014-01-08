var EventEmitter = require('events').EventEmitter
var Plex = require('plexy')
var behave = require('./behaviors')
var engine = require('./scripts/engine')
//////

var engineStream = engine.getStream()

// context management
window.events = new EventEmitter()
window.context = {
  decks: {
    'left': {
      slots: {},
      changeStream: Plex(engineStream, 'soundbank[left]'),
      noteStream: Plex(engineStream, 'playback[left]')
    },
    'right': {
      slots: {},
      changeStream: Plex(engineStream, 'soundbank[right]'),
      noteStream: Plex(engineStream, 'playback[right]')
    }
  }
}

window.context.decks.left.changeStream.on('data', function(descriptor){
  window.context.decks.left.slots[descriptor.id] = descriptor
})

window.context.decks.right.changeStream.on('data', function(descriptor){
  window.context.decks.right.slots[descriptor.id] = descriptor
})

// apply behaviors
var notifyDom = behave()

// load data

setTimeout(function(){
  window.context.decks.left.changeStream.write({
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
}, 200)

window.chooseProject = chooseProject

function chooseProject(){
  chrome.fileSystem.chooseEntry({type: 'openDirectory'}, function(entry) {
    // use local storage to retain access to this file
    loadProject(entry)
  })
}

function loadProject(entry){
  chrome.storage.local.set({'projectDirectory': chrome.fileSystem.retainEntry(entry)})
  chrome.fileSystem.getDisplayPath(entry, function(path){
    console.log('Loaded project', path)
  })
}

chrome.storage.local.get('projectDirectory', function(items) {
  if (items.projectDirectory) {
    chrome.fileSystem.isRestorable(items.projectDirectory, function(bIsRestorable) {
      if (!bIsRestorable){
        return chooseProject()
      }
      chrome.fileSystem.restoreEntry(items.projectDirectory, function(chosenEntry) {
        if (chosenEntry) {
          loadProject(chosenEntry)
        }
      })
    })
  } else {
    chooseProject()
  }
})