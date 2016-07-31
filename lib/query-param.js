var jsonQuery = require('json-query')
var computed = require('@mmckegg/mutant/computed')
var resolve = require('@mmckegg/mutant/resolve')

module.exports = QueryParam

function QueryParam (param, query, defaultValue) {
  var result = computed([param], function (value) {
    var res = jsonQuery(query, {data: value})

    // fallback to inner value
    res = res.value === undefined && param.node
      ? jsonQuery(query, {data: read(param.node)})
      : res

    return res.value === undefined ? defaultValue : res.value
  })

  result.set = function (value) {
    var newObject = obtain(resolve(param))

    var res = jsonQuery(query, {data: newObject, force: defaultValue})
    var obj = jsonQuery.lastParent(res)

    if (obj) {
      if (value === undefined) {
        delete obj[res.key]
      } else {
        obj[res.key] = value
      }
      param.set(newObject)
      return true
    } else {
      return false
    }
  }

  result.context = param.context

  return result
}

function obtain (obj) {
  return JSON.parse(JSON.stringify(obj))
}

function read (target) {
  if (typeof target === 'function') {
    return target()
  } else if (target && target.read) {
    return target.read()
  }
}
