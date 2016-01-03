var ObservStruct = require('observ-struct')
var Observ = require('observ')
var watch = require('observ/watch')

module.exports = ObservKeys

function ObservKeys (obs, mapping) {
  var keys = Object.keys(mapping)
  var lookup = keys.reduce(function (result, key) {
    if (Array.isArray(mapping[key])) {
      mapping[key].forEach(function (k) {
        result[k] = key
      })
    } else {
      result[mapping[key]] = key
    }
    return result
  }, {})

  var obj = keys.reduce(function (result, key) {
    result[key] = Observ(null)
    return result
  }, {})

  var struct = ObservStruct(obj)

  watch(obs, function (down) {
    struct.set(down.reduce(function (result, code) {
      var key = lookup[code]
      if (key !== null) result[key] = true
      return result
    }, {}))
  })

  return struct
}
