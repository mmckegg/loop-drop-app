var EventEmitter = require('events').EventEmitter
var behave = require('./behaviors')
//////

window.events = new EventEmitter()
window.context = {
  audio: require('./audio-context')
}

// apply behaviors
window.behave = behave()