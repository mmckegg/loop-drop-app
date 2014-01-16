var h = require('create-element')

module.exports = function(container){
  container.addEventListener('mousedown', function(e){
    var element = e.target
    var path = container.dataset.path

    if (element.dataset.value){
      window.events.emit('updateActiveSlot', path, parseInt(element.dataset.value))
    }
  })
}