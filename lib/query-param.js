var jsonQuery = require('json-query')
var forceParent = require('json-query/force-parent')

module.exports = QueryParam

function QueryParam(target, query, forceParent, context){
  if (!(this instanceof QueryParam)) return new QueryParam(target, query, forceParent, context)
  this.target = target
  this.query = query
  this.forceParent = forceParent
  this.context = context || target.context
}

QueryParam.prototype.type = 'QueryParam'

QueryParam.prototype.write = QueryParam.prototype.set = function(value){
  var newObject = obtain(read(this.target))
  var res = jsonQuery(this.query, {data: newObject})
  var obj = this.forceParent ? 
    forceParent(res, this.forceParent) : 
    jsonQuery.lastParent(res)

  if (obj){
    if (value === undefined){
      delete obj[res.key]
    } else {
      obj[res.key] = value
    }
    this.target.set(newObject)
    return true
  } else {
    return false
  }
}

QueryParam.prototype.read = function(){
  var res = jsonQuery(this.query, {data: read(this.target)})
  return res.value
}

function obtain(obj){
  return JSON.parse(JSON.stringify(obj))
}

function read(target){
  if (typeof target === 'function'){
    return target()
  } else if (target && target.read){
    return target.read()
  }
}