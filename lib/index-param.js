var read = require('lib/read')

module.exports = IndexParam

function IndexParam(target, index){
  if (!(this instanceof IndexParam)) return new IndexParam(target, index)
  this.target = target
  this.index = index
  this.context = target.context
}

IndexParam.prototype.set = function(value){
  var current = read(this.target)
  var val = Array.isArray(current) ? current : []
  var res = val.slice()
  res[this.index] = parseFloat(value) || 0
  this.target.set(res)
}

IndexParam.prototype.read = function(){
  var current = read(this.target)
  var val = Array.isArray(current) ? current : []
  return val[this.index]
}