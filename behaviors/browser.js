var extend = require('loop-drop-browser')
var ObservStruct = require('observ-struct')
var Observ = require('observ')

module.exports = function(element){
  var state = ObservStruct({
    selected: Observ(),
    entries: Observ([])
  })

  var releaseListener = null

  if (window.currentProject){
    releaseListener = window.currentProject.entries(state.entries.set)
    state.entries.set(window.currentProject.entries())
  }

  window.events.on('project', function(project){
    if (releaseListener){
      releaseListener()
      releaseListener = project.entries(state.entries.set)
      state.entries.set(project.entries())
    }
  })

  state.selected(function(data){
    window.events.emit('select', data)
  })

  extend(element, state)
}