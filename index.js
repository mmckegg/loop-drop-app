var EventEmitter = require('events').EventEmitter
var Plex = require('plexy')
var behave = require('./behaviors')
//////

window.events = new EventEmitter()
window.context = {
  audio: new webkitAudioContext()
}

// apply behaviors
var notifyDom = behave()
window.events.on('domChange', notifyDom)