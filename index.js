var EventEmitter = require('events').EventEmitter
var behave = require('./behaviors')
//////

window.events = new EventEmitter()
window.context = {
  audio: require('loop-drop-audio-context')
}

// apply behaviors
window.behave = behave()