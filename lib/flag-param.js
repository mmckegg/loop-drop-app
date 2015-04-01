var read = require('lib/read')

module.exports = FlagParam

function FlagParam(target, flag){
  if (!(this instanceof FlagParam)) return new FlagParam(target, flag)
  this.target = target
  this.flag = flag
  this.context = target.context
}

FlagParam.prototype.set = function(value){
  var current = read(this.target)
  var val = Array.isArray(current) ? current.slice() : []

  var index = val.indexOf(this.flag)
  var currentState = !!~index
  var newState = !!value

  if (newState !== currentState){
    if (newState){
      val.push(this.flag)
    } else {
      val.splice(index, 1)
    }
  }

  this.target.set(val)
}

FlagParam.prototype.read = function(){
  var current = read(this.target)
  return Array.isArray(current) ? !!~current.indexOf(this.flag) : false
}
