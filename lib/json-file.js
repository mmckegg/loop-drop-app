var watch = require('mutant/watch')

var PARSE_ERROR = {}

module.exports = JsonFile

function JsonFile (file, listener) {
  var lastSaved = null

  watch(file, function (data) {
    if (lastSaved !== data) {
      var parsed = tryParse(data)
      if (parsed !== PARSE_ERROR) {
        lastSaved = data
        data = parsed
        listener(data)
      }
    }
  })

  return function save (value) {
    var data = JSON.stringify(value)
    if (lastSaved !== data) {
      lastSaved = data
      file.set(data)
    }
  }
}

function tryParse (data) {
  try {
    return JSON.parse(data)
  } catch (ex) {
    return PARSE_ERROR
  }
}
