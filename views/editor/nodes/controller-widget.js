var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var nextTick = require('next-tick')

module.exports = Controller

function Controller(render, node, setup, collection){
  if (!(this instanceof Controller)) return new Controller(render, node, setup, collection)
  this.node = node
  this.setup = setup
  this.collection = collection
  this.render = render
}

Controller.prototype.init = function(){

  var state = this.state = {
    setupReleases: [],
    nodeReleases: [],
    node: this.node,
    setup: this.setup,
    collection: this.collection,
    render: this.render,
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
    if (state.node && state.setup && state.collection){
      return state.render(state.node, state.setup, state.collection)
    } else {
      return h('div')
    }
  }, mercury)

  bindToNode(this, update)
  bindToSetup(this, update)

  return loop.target
}

Controller.prototype.update = function(prev, elem){
  var state = this.state = prev.state
  state.node = this.node
  state.collection = this.collection
  state.setup = this.setup
  state.render = this.render
  if (this.node !== prev.node){
    bindToNode(this, state.update)
    state.update()
  }
  if (this.setup !== prev.setup){
    bindToSetup(this, state.update)
    state.update()
  }
}

Controller.prototype.destroy = function(elem){
  var state = this.state
  state.nodeReleases.forEach(invoke)
  state.nodeReleases.length = 0
  state.setupReleases.forEach(invoke)
  state.setupReleases.length = 0
}

function bindToNode(self, handler){
  var state = self.state
  var node = self.node

  state.nodeReleases.forEach(invoke)
  state.nodeReleases.length = 0

  state.nodeReleases.push(
    node.gridState(handler)
  )
}

function bindToSetup(self, handler){
  var state = self.state
  var setup = self.setup

  state.setupReleases.forEach(invoke)
  state.setupReleases.length = 0

  state.setupReleases.push(
    setup.selectedChunkId(handler),
    setup.chunks.resolved(handler)
  )
}

Controller.prototype.type = 'Widget'


function invoke(func){
  return func()
}