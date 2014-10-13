var Observ = require('observ')
var ObservStruct = require('observ-struct')
var watch = require('observ/watch')
var MPE = require('../../../../lib/mouse-position-event.js')

var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var renderGrid = require('./grid.js')
var nextTick = require('next-tick')

var renderParams = require('./params.js')

module.exports = Launchpad

function Launchpad(node, setup, collection){
  if (!(this instanceof Launchpad)) return new Launchpad(node, setup, collection)
  this.node = node
  this.setup = setup
  this.collection = collection
}

Launchpad.prototype.init = function(){

  var state = this.state = {
    setupReleases: [],
    nodeReleases: [],
    node: this.node,
    setup: this.setup,
    collection: this.collection,
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
      return h('div LaunchpadNode', {
        draggable: true,
        'ev-dragstart': MPE(dragStart, state),
        'ev-dragend': MPE(dragEnd, state),
        'ev-dragover': MPE(dragOver, state)
      }, [
        h('header', [
          h('span', 'Launchpad (' + state.node().port + ')'),
          h('button.remove Button -warn', {
            'ev-click': mercury.event(state.collection.remove, state.node),
          }, 'X')
        ]),
        h('section', [
          renderGrid(state.node, state.setup),
          h('div.controls', renderParams(state.node, state.setup))
        ])
      ])
    } else {
      return h('div')
    }
  })

  bindToNode(this, update)
  bindToSetup(this, update)

  return loop.target
}

Launchpad.prototype.update = function(prev, elem){
  var state = this.state = prev.state
  state.node = this.node
  state.collection = this.collection
  state.setup = this.setup
  if (this.node !== prev.node){
    bindToNode(this, state.update)
    state.update()
  }
  if (this.setup !== prev.setup){
    bindToSetup(this, state.update)
    state.update()
  }
}

Launchpad.prototype.destroy = function(elem){
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

Launchpad.prototype.type = 'Widget'

function dragOver(ev){
  var currentDrag = window.currentDrag
  if (currentDrag && currentDrag.data.node && currentDrag.data.node !== ev.data.node){
    var index = ev.data.collection.indexOf(ev.data.node)
    if (~index){
      ev.data.collection.move(currentDrag.data.node, index)
    }
  }
}

function dragStart(ev){
  window.currentDrag = ev
}

function dragEnd(ev){
  window.currentDrag = null
}

function invoke(func){
  return func()
}