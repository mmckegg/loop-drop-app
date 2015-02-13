var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var Collection = require('./collection.js')
var Spawner = require('./spawner.js')

module.exports = renderSetup

function renderSetup(setup){
  var controllerSpawners = setup.context.nodes.controller._spawners
  return h('SetupNode', [
    h('.main NodeCollection -across', [
      h('h1', 'Controllers'),
      Collection(setup.controllers),
      Spawner(setup.controllers, {nodes: controllerSpawners})
    ]),
    h('.chunks NodeCollection', [
      h('h1', 'Chunks'),
      Collection(setup.chunks)
    ])
  ])
}