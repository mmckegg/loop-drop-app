var extend = require('loop-drop-editor')

var NO_TRANSACTION = {}

module.exports = function(element){
  var state = ObservStruct({
    file: Observ()
  })

  var releaseListener = null
  var releaseUpdateListener = null

  var currentTransaction = NO_TRANSACTION
  var currentUpdateTransaction = NO_TRANSACTION

  window.events.on('select', function(path){
    window.currentProject.getFile(path, function(err, file){
      if (releaseListener){
        releaseListener()
        releaseUpdateListener()

        releaseListener = file(function(data){
          var lastTransaction = currentUpdateTransaction
          if (currentUpdateTransaction !== data){
            currentTransaction = data
            state.file.set(data)
            currentTransaction = lastTransaction
          }
        })

        state.entries.set(project.entries())

        releaseUpdateListener = state.file(function(data){
          var lastTransaction = currentTransaction
          if (currentTransaction !== data){
            currentUpdateTransaction = data
            file.set(data)
            currentUpdateTransaction = lastTransaction
          }
        })
      }
    })
  })

  extend(element, state)
}