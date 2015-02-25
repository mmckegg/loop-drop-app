var mercury = require('mercury')

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
    var loop = mercury.main(this.observ(), this.render, mercury)
    this.removeListener = this.observ(loop.update)
    return loop.target
  } else {
    return mercury.create(mercury.h('div'))
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