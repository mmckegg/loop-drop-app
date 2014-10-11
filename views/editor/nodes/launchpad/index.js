var Observ = require('observ')
var ObservStruct = require('observ-struct')
var watch = require('observ/watch')

var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var renderGrid = require('./grid.js')
var nextTick = require('next-tick')

var renderParams = require('./params.js')

module.exports = Launchpad

function Launchpad(controller, setup){
  if (!(this instanceof Launchpad)) return new Launchpad(controller, setup)
  this.controller = controller
  this.setup = setup
}

Launchpad.prototype.init = function(){

  var state = this.state = {
    setupReleases: [],
    controllerReleases: [],
    controller: this.controller,
    setup: this.setup,
    update: update
  }

  var pendingUpdate = false

  function update(){
    if (!pendingUpdate){
      pendingUpdate = true
      nextTick(doUpdate)
    }
  }

  function doUpdate(){
    pendingUpdate = false
    loop.update()
  }

  var loop = mercury.main(null, function(){
    if (state.controller && state.setup){
      return h('div LaunchpadNode', [
        h('header', 'Launchpad (' + state.controller().port + ')'),
        h('section', [
          renderGrid(state.controller, state.setup),
          h('div.controls', renderParams(state.controller, state.setup))
        ])
      ])
    } else {
      return h('div')
    }
  })

  bindToController(this, update)
  bindToSetup(this, update)

  return loop.target
}

Launchpad.prototype.update = function(prev, elem){
  var state = this.state = prev.state
  state.controller = this.controller
  state.setup = this.setup
  if (this.controller !== prev.controller){
    bindToController(this, state.update)
    state.update()
  }
  if (this.setup !== prev.setup){
    bindToSetup(this, state.update)
    state.update()
  }
}

Launchpad.prototype.destroy = function(elem){
  var state = this.state
  state.controllerReleases.forEach(invoke)
  state.controllerReleases.length = 0
  state.setupReleases.forEach(invoke)
  state.setupReleases.length = 0
}

function bindToController(self, handler){
  var state = self.state
  var controller = self.controller

  state.controllerReleases.forEach(invoke)
  state.controllerReleases.length = 0

  state.controllerReleases.push(
    controller.gridState(handler)
  )
}

function bindToSetup(self, handler){
  var state = self.state
  var setup = self.setup

  state.setupReleases.forEach(invoke)
  state.setupReleases.length = 0

  state.setupReleases.push(
    setup.selectedChunkId(handler)
  )
}

Launchpad.prototype.type = 'Widget'


function invoke(func){
  return func()
}