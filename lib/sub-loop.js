var VirtualDom = require('virtual-dom')
var MainLoop = require('main-loop')
var createElement = require('virtual-dom/create-element')
var h = require('micro-css/h')(require('virtual-dom/h'))

module.exports = SubLoop

function SubLoop(observ, render){
  if (!(this instanceof SubLoop)) return new SubLoop(observ, render)
  this.observ = observ
  this.render = render
}

SubLoop.prototype.type = 'Widget'

SubLoop.prototype.init = function(){
  if (this.removeListener){
    this.removeListener()
  }

  if (typeof this.observ == 'function' && typeof this.render === 'function'){
    var loop = MainLoop(this.observ(), this.render, VirtualDom)
    this.removeListener = this.observ(loop.update)
    return loop.target
  } else {
    return createElement(h('div'))
  }
}

SubLoop.prototype.update = function(prev, elem){
  this.removeListener = prev.removeListener
  if (this.observ !== prev.observ || this.render !== prev.render){
    return this.init()
  }
}

SubLoop.prototype.destroy = function(prev, elem){
  if (this.removeListener){
    this.removeListener()
  }
}