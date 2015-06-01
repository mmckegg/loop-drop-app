var read = require('lib/read')

module.exports = IndexParam

function IndexParam(target, index, formatter){
  if (!(this instanceof IndexParam)) return new IndexParam(target, index, formatter)
  this.target = target
  this.index = index
  this.formatter = formatter
  this.context = target.context
}

IndexParam.prototype.set = function(value){
  var current = read(this.target)
  var val = Array.isArray(current) ? current : []
  var res = val.slice()
  if (typeof this.formatter === 'function') {
    value = this.formatter(value)
  }
  res[this.index] = value
  this.target.set(res)
}

IndexParam.prototype.read = function(){
  var current = read(this.target)
  var val = Array.isArray(current) ? current : []
  return val[this.index]
}