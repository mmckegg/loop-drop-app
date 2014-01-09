var EventEmitter = require('events').EventEmitter
var Plex = require('plexy')
var behave = require('./behaviors')
var engine = require('./scripts/engine')
//////

var engineStream = engine.getStream()

// context management
window.events = new EventEmitter()
window.context = {
  clock: Plex(engineStream, 'clock'),
  beatStream: Plex(engineStream, 'beat'),
  commandStream: Plex(engineStream, 'commands'),
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