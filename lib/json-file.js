var Observ = require('observ')
var watch = require('observ/watch')

var PARSE_ERROR = {}
var NO_TRANSACTION = {}

module.exports = JsonFile

function JsonFile(file){
  var obs = Observ()
  var lastSaved = null
  var currentTransaction = NO_TRANSACTION

  var removeWatcher = watch(file, function(data) {
    if (lastSaved !== data){
      var parsed = tryParse(data)
      if (parsed !== PARSE_ERROR) {
        lastSaved = data
        data = parsed
        currentTransaction = data
        obs.set(data)
        currentTransaction = NO_TRANSACTION
      }
    }
  })

  var removeListener = obs(function(data){
    if (data !== currentTransaction){
      lastSaved = JSON.stringify(data)
      file.set(lastSaved)
    }
  })

  obs.destroy = function(){
    removeListener()
    removeWatcher()
    file.close()
    obs.set(null)
  }

  return obs
}

function tryParse(data) {
  try {
    return JSON.parse(data)
  } catch (ex) {
    return PARSE_ERROR
  }
}