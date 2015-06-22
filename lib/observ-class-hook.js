var watch = require('observ/watch')
var nextTick = require('next-tick')

module.exports = ObservClassHook

function ObservClassHook(obs, className){
  if (!(this instanceof ObservClassHook)) return new ObservClassHook(obs, className)
  this.obs = obs
  this.className = className
}

function update(className, value){
  var node = this
  if (value) {
    node.classList.add(className)
  } else {
    node.classList.remove(className)
  }
}

ObservClassHook.prototype.hook = function(node, prop, prev){
  var self = this
  if (!prev || prev.obs !== self.obs){
    self.removeListener && self.removeListener()
    if (self.obs){
      nextTick(function(){
        self.removeListener = watch(self.obs, update.bind(node, self.className))
      })
    }
  }
}

ObservClassHook.prototype.unhook = function(node, prop, next){
  if (next){
    next.removeListener = this.removeListener
  } else {
    this.removeListener && this.removeListener()
  }
}