var mercury = require('mercury')
var h = require('micro-css/h')(mercury.h)

var Observ = require('observ')
var ObservStruct = require('observ-struct')
var nextTick = require('next-tick')
var watch = require('observ/watch')

var renderNode = require('./nodes')

module.exports = Editor

function Editor(fileObject){
  if (!(this instanceof Editor)) return new Editor(fileObject)
  this.fileObject = fileObject
}

Editor.prototype.type = 'Widget'

Editor.prototype.init = function(){
  var element = document.createElement('div')
  this.element = element
  this.releases = []
  this.state = ObservStruct({
    object: Observ(),
    resolved: Observ()
  })
  bindToObject(this)
  mercury.app(element, this.state, function(data){
    if (element.fileObject){
      return renderNode(element.fileObject, element.fileObject)
    } else {
      return h('div')
    }
  })
  return element
}

Editor.prototype.update = function(prev, elem){
  this.element = elem
  this.state = prev.state
  this.releases = prev.releases
  if (this.fileObject !== prev.fileObject){
    bindToObject(this)
  }
}

Editor.prototype.destroy = function(elem){
  this.releases.forEach(invoke)
  this.releases.length = 0
}

function bindToObject(self){
  var state = self.state
  var fileObject = self.fileObject
  var element = self.element

  // for renderer
  element.fileObject = fileObject

  while (self.releases.length){
    self.releases.pop()()
  }

  if (fileObject){
    nextTick(function(){
      self.releases.push(
        watch(fileObject, state.object.set)
      )
    })

    if (fileObject.resolved){
      self.releases.push(
        watch(fileObject.resolved, state.resolved.set)
      )
    }
  } else {
    state.object.set(null)
    state.resolved.set(null)
  }

}

function invoke(func){
  return func()
}