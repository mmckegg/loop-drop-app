var VirtualDom = require('virtual-dom')
var MainLoop = require('main-loop')
var h = require('micro-css/h')(require('virtual-dom/h'))

var Observ = require('observ')
var nextTick = require('next-tick')
var watch = require('observ/watch')

var renderNode = require('lib/render-node')

module.exports = Editor

function Editor(fileObject){
  if (!(this instanceof Editor)) return new Editor(fileObject)
  this.fileObject = fileObject
}

Editor.prototype.type = 'Widget'

Editor.prototype.init = function(){

  var state = this.state = {
    releases: [],
    fileObject: this.fileObject,
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

    // HACK: schedule 300 ms ahead to avoid audio interuption
    state.fileObject.context.scheduler.schedule(0.3)
    loop.update()
  }

  var loop = MainLoop(null, function(){
    if (state.fileObject && state.fileObject.node){
      return renderNode(state.fileObject.node)
    } else {
      return h('div')
    }
  }, VirtualDom)

  bindToObject(this, update)

  return loop.target
}

Editor.prototype.update = function(prev, elem){
  var state = this.state = prev.state
  state.fileObject = this.fileObject

  if (this.fileObject !== prev.fileObject){
    bindToObject(this, state.update)
    state.update()
  }
}

Editor.prototype.destroy = function(elem){
  var state = this.state
  state.releases.forEach(invoke)
  state.releases.length = 0
}

function bindToObject(self, update){
  var state = self.state
  var fileObject = self.fileObject

  state.releases.forEach(invoke)
  state.releases.length = 0

  if (fileObject){
    state.releases.push(
      fileObject.onNode(update),
      fileObject(update)
    )
    if (fileObject.resolved){
      state.releases.push(
        fileObject.resolved(update)
      )
    }
  }
}

function invoke(func){
  return func()
}