var watch = require('observ/watch')
var nextTick = require('next-tick')

module.exports = ObservValueHook

function ObservValueHook(obs, getValue){
  if (!(this instanceof ObservValueHook)) return new ObservValueHook(obs, getValue)
  this.obs = obs
  this.getValue = getValue
}

function update(prop, getValue, value){
  var node = this
  node[prop] = getValue ? getValue(value) : value
}

ObservValueHook.prototype.handleEvent = function (e) {
  this.obs.set(parseFloat(e.currentTarget.value||0))
}

ObservValueHook.prototype.hook = function(node, prop, prev){
  var self = this
  node.addEventListener('input', this)  
  if (!prev || prev.obs !== self.obs){
    self.removeListener && self.removeListener()
    if (self.obs){
      nextTick(function(){
        self.removeListener = watch(self.obs, update.bind(node, prop, self.getValue))
      })
    }
  }
}

ObservValueHook.prototype.unhook = function(node, prop, next){
  node.removeEventListener('input', this)
  if (next){
    next.removeListener = this.removeListener
  } else {
    this.removeListener && this.removeListener()
  }
}