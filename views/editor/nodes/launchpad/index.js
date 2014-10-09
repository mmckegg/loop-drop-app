var Observ = require('observ')
var ObservStruct = require('observ-struct')
var watch = require('observ/watch')
var mercury = require('mercury')
var renderGrid = require('./grid.js')
var nextTick = require('next-tick')

module.exports = Launchpad

function Launchpad(controller, fileObject, query){
  if (!(this instanceof Launchpad)) return new Launchpad(controller, fileObject, query)
  this.controller = controller
  this.fileObject = fileObject
  this.query = query
}

Launchpad.prototype.init = function(){

  this.state = Observ()

  this.releases = []

  var controller = this.controller
  var actions = {}

  var loop = mercury.main(this.state(), function(data){
    return mercury.h('div.LaunchpadNode', [
      mercury.h('header', 'Launchpad (' + controller().port + ')'),
      renderGrid(data, actions)
    ])
  })

  this.state(loop.update)

  var element = this.element = loop.target
  bindToController(this)
  return element
}

Launchpad.prototype.update = function(prev, elem){
  this.element = prev.element
  this.state = prev.state
  this.releases = prev.releases
  if (this.controller !== prev.controller){
    bindToController(this, this.controller)
  }
}

Launchpad.prototype.type = 'Widget'

function bindToController(self){
  var state = self.state
  var controller = self.controller


  while (self.releases.length){
    self.releases.pop()()
  }

  self.releases.push(
    nextTick(function(){
      self.releases.push(
        watch(controller.gridState, state.set)
      )
    })
  )

}

function invoke(func){
  return func()
}