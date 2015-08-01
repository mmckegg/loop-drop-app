var watch = require('observ/watch')
var nextTick = require('next-tick')

module.exports = ObservClassHook

function ObservClassHook(obs, className, shouldToggle){
  if (!(this instanceof ObservClassHook)) return new ObservClassHook(obs, className, shouldToggle)
  this.obs = obs
  this.className = className
  this.shouldToggle = shouldToggle
}

function update(className, value){
  var node = this
  if (value) {
    node.classList.add(className)
  } else {
    node.classList.remove(className)
  }
}

ObservClassHook.prototype.handleEvent = function (e) {
  this.obs.set(!this.obs())
}

ObservClassHook.prototype.hook = function(node, prop, prev){
  var self = this

  if (self.shouldToggle) {
    node.addEventListener('click', this)
  }

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
  if (self.shouldToggle) {
    node.removeEventListener('click', this)
  }
  if (next){
    next.removeListener = this.removeListener
  } else {
    this.removeListener && this.removeListener()
  }
}