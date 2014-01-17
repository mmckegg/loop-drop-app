var EventEmitter = require('events').EventEmitter
var behave = require('./behaviors')
//////

window.events = new EventEmitter()
window.context = {
  audio: new webkitAudioContext()
}

// apply behaviors
window.behave = behave()