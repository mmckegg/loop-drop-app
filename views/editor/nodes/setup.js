var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var renderCollection = require('./collection.js')

module.exports = renderSetup

function renderSetup(setup){
  if (setup){
    return h('SetupNode', [
      h('NodeCollection', renderCollection(setup.controllers, setup, 'controllers')),
      h('NodeCollection .chunks', renderCollection(setup.chunks, setup, 'chunks')),
    ])
  }
}