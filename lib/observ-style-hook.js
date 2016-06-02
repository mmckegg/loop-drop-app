var watch = require('observ/watch')
var nextTick = require('next-tick')

module.exports = ObservStyleHook

function ObservStyleHook(obs, prop, getValue){
  if (!(this instanceof ObservStyleHook)) return new ObservStyleHook(obs, prop, getValue)
  this.obs = obs
  this.prop = prop
  this.getValue = getValue
}

function update(prop, getValue, value){
  var node = this
  node.style[prop] = getValue ? getValue(value) : value
}

ObservStyleHook.prototype.hook = function(node, prop, prev){
  var self = this
  if (typeof self.obs === 'function') {
    update.call(node, self.prop, self.getValue, self.obs())
  }
  if (!prev || prev.obs !== self.obs){
    self.removeListener && self.removeListener()
    if (self.obs){
      nextTick(function(){
        self.removeListener = watch(self.obs, update.bind(node, self.prop, self.getValue))
      })
    }
  }
}

ObservStyleHook.prototype.unhook = function(node, prop, next){
  node.style[this.prop] = ''
  if (next){
    next.removeListener = this.removeListener
  } else {
    this.removeListener && this.removeListener()
  }
}
