module.exports = function(element){
  var connected = false
  
  element.onclick = function(){
    if (!connected){
      window.events.emit('connect', 'ws://localhost:7777')
    } else {
      window.events.emit('disconnect')
    }
  }

  window.events.on('connected', function(server){
    element.classList.add('-active')
    connected = true
  })

  window.events.on('disconnected', function(){
    element.classList.remove('-active')
    connected = false
  })
}