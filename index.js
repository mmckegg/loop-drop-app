var EventEmitter = require('events').EventEmitter
var Plex = require('plexy')
var behave = require('./behaviors')
//////

window.events = new EventEmitter()
window.context = {
  audio: new webkitAudioContext()
}

// apply behaviors
window.behave = behave()