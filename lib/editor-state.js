var ObservStruct = require('observ-struct')
var Observ = require('observ')

var NO_TRANSACTION = {}

module.exports = function(selected){
  var state = ObservStruct({
    descriptor: Observ()
  })

  var project = window.context.project

  var releaseListener = null
  var releaseUpdateListener = null

  var currentTransaction = NO_TRANSACTION
  var currentUpdateTransaction = NO_TRANSACTION

  selected(function(path){
    var src = project.relative(path)
    project.getFile(src, function(err, file){
      if (releaseListener){
        releaseListener()
        releaseUpdateListener()
      }

      console.log('editing', path)

      releaseListener = file(function(data){
        var lastTransaction = currentUpdateTransaction
        if (currentUpdateTransaction !== data){
          currentTransaction = JSON.parse(data)
          state.descriptor.set(currentTransaction)
          currentTransaction = lastTransaction
        }
      })

      releaseUpdateListener = state.descriptor(function(data){
        var lastTransaction = currentTransaction
        if (currentTransaction !== data){
          currentUpdateTransaction = JSON.stringify(data)
          file.set(currentUpdateTransaction)
          currentUpdateTransaction = lastTransaction
        }
      })

      state.descriptor.set(JSON.parse(file() || '{}') || {})
    })
  })

  return state
}