module.exports = Param
var jsonQuery = require('json-query')
var forceParent = require('json-query/force-parent')

function Param(target, query, forceParent){
  if (!(this instanceof Param)) return new Param(target, query, forceParent)
  this.target = target
  this.query = query
  this.forceParent = forceParent
}

Param.prototype.set = function(value){
  var newObject = obtain(this.target())
  var res = jsonQuery(this.query, {data: newObject})
  var obj = this.forceParent ? 
    forceParent(res, this.forceParent) : 
    jsonQuery.lastParent(res)

  if (obj){
    obj[res.key] = value
    this.target.set(newObject)
    return true
  } else {
    return false
  }
}

Param.prototype.read = function(){
  var res = jsonQuery(this.query, {data: this.target()})
  return res.value
}

function obtain(obj){
  return JSON.parse(JSON.stringify(obj))
}