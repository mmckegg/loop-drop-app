var watch = require('observ/watch')
var nextTick = require('next-tick')

module.exports = GridStateHook

function GridStateHook(gridState){
  if (!(this instanceof GridStateHook)) return new GridStateHook(gridState)
  this.gridState = gridState
}

function updateRows(data){
  var node = this
  var playing = data.playing
  var active = data.active
  var triggers = data.triggers
  var recording = data.recording

  for (var r=0;r<triggers.shape[0];r++){
    for (var c=0;c<triggers.shape[1];c++){
      var button = node.childNodes[r].childNodes[c]
      var classes = '.button'

      if (triggers.get(r,c)) classes += ' -present'
      if (playing.get(r,c)) classes += ' -playing'
      if (recording.get(r,c)) classes += ' -recording'
      if (active.get(r,c)) classes += ' -active'
      //if (buttonState.noRepeat) classes += ' -noRepeat'
    
      if (button.className !== classes){
        button.className = classes
      }
    }
  }
}

GridStateHook.prototype.hook = function(node, prop, prev){
  var self = this
  if (!prev || prev.gridState !== self.gridState){
    self.removeListener && self.removeListener()
    if (self.gridState){
      nextTick(function(){
        self.removeListener = watch(self.gridState, updateRows.bind(node))
      })
    }
  }
}

GridStateHook.prototype.unhook = function(node, prop, next){
  if (next){
    next.removeListener = this.removeListener
  } else {
    this.removeListener && this.removeListener()
  }
}