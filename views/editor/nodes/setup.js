var mercury = require('mercury')
var renderCollection = require('./collection.js')

module.exports = renderSetup

function renderSetup(setup){
  if (setup){
    return mercury.h('div.Setup', [
      mercury.h('div.NodeCollection.-wrap', renderCollection(setup.controllers, setup, 'controllers')),
      mercury.h('div.NodeCollection.-wrap', renderCollection(setup.chunks, setup, 'chunks')),
    ])
  }
}