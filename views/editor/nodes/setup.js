var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)
var renderCollection = require('./collection.js')

module.exports = renderSetup

function renderSetup(setup){
  if (setup){
    return h('SetupNode', [
      h('.main NodeCollection -across', [
        renderCollection(setup.controllers, setup),
        spawner(setup)
      ]),
      h('.chunks NodeCollection', [
        renderCollection(setup.chunks, setup)
      ])
    ])
  }
}

function spawnController(opts){
  if (opts.node && opts.setup){
    opts.setup.controllers.push({ node: opts.node })
  }
}

function spawner(setup){
  return h('div.spawner -controller', [
    h('button Button -main -spawn', {
      'ev-click': mercury.event(spawnController, {node: 'controller/launchpad', setup: setup })
    }, '+ controller')
  ])
}