module.exports = Param
var jsonQuery = require('json-query')

function Param(target, query){
  if (!(this instanceof Param)) return new Param(target, query)
  this.target = target
  this.query = query
}

Param.prototype.set = function(value){
  var newObject = obtain(this.target())
  var res = jsonQuery(this.query, {data: newObject})
  var obj = jsonQuery.lastParent(res)
  if (obj){
    obj[res.key] = value
    this.target.set(newObject)
  }
}

Param.prototype.read = function(){
  var res = jsonQuery(this.query, {data: this.target()})
  return res.value
}

function obtain(obj){
  return JSON.parse(JSON.stringify(obj))
}