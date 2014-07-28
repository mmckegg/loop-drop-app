module.exports = function(element){
  var active = false
  
  element.onclick = function(){
    if (!active){
      window.events.emit('showRemote')
    } else {
      window.events.emit('hideRemote')
    }
  }

  window.events.on('showRemote', function(server){
    element.classList.add('-active')
    active = true
  })

  window.events.on('hideRemote', function(){
    element.classList.remove('-active')
    active = false
  })
}