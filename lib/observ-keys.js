var ObservStruct = require('observ-struct')
var convertKeyCode = require('keycode')
var Observ = require('observ')
var watch = require('observ/watch')

module.exports = ObservKeys

function ObservKeys(obs, mapping){

  var keys = Object.keys(mapping)
  var codes = keys.map(function(key){
    return getKeyCode(mapping[key])
  })

  var obj = keys.reduce(function(result, key){
    result[key] = Observ(null)
    return result
  }, {})

  var struct = ObservStruct(obj)

  watch(obs, function(down){
    struct.set(down.reduce(function(result, code){
      var index = codes.indexOf(code)
      if (~index) result[keys[index]] = true
      return result
    }, {}))
  })

  return struct
}

function getKeyCode(key){
  if (typeof key === 'string'){
    return convertKeyCode(key)
  } else {
    return key
  }
}