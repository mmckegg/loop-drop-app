var Observ = require('@mmckegg/mutant/value')
var watch = require('@mmckegg/mutant/watch')
var watchThrottle = require('throttle-observ/watch')

var PARSE_ERROR = {}
var NO_TRANSACTION = {}

module.exports = JsonFile

function JsonFile(file){
  var obs = Observ()
  var lastSaved = null
  var currentTransaction = NO_TRANSACTION
  var initialized = false

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

  var removeListener = watchThrottle(obs, 40, function (data) {
    if (data !== currentTransaction && initialized) {
      var value = JSON.stringify(data)
      if (lastSaved !== value) {
        lastSaved = value
        file.set(lastSaved)
      }
    }
  })

  obs.destroy = function(){
    removeListener()
    removeWatcher()
    file.close()
    obs.set(null)
  }

  initialized = true
  return obs
}

function tryParse(data) {
  try {
    return JSON.parse(data)
  } catch (ex) {
    return PARSE_ERROR
  }
}
