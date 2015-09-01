var ObservVarhash = require('observ-varhash')
var nextTick = require('next-tick')

module.exports = ExternalRouter

function ExternalRouter (context, defaultValue) {
  var obs = ObservVarhash()
  var externalConnections = []
  var reconnecting = false

  var set = obs.set
  obs.set = function (v) {
    set(v == null ? defaultValue : v)
  }

  obs(function(data){
    obs.reconnect()
  })

  obs.reconnect = function(){
    if (!reconnecting){
      reconnecting = true
      nextTick(reconnect)
    }
  }

  var releaseWatcher = context.chunkLookup && context.chunkLookup(obs.reconnect)


  obs.destroy = function(){
    while (externalConnections.length){
      externalConnections.pop().disconnect()
    }

    releaseWatcher && releaseWatcher()
    releaseWatcher = null
    // destroy all the child nodes
  }

  return obs

  // scoped

  function reconnect(){
    reconnecting = false

    // disconnect all current connections
    while (externalConnections.length){
      externalConnections.pop().disconnect()
    }

    var routes = obs() || {}

    Object.keys(routes).forEach(function(from){

      var target = routes[from]
      var output = context.slotLookup.get(from)

      if (typeof target === 'string'){
        target = [target]
      }

      if (output && Array.isArray(target)){
        var routed = false

        target.forEach(function(to){
          if (to && typeof to === 'string'){
            if (to === '$default'){
              output.connect(context.output)
              routed = true
            } else {
              to = to.split('#')
              var destinationChunk = context.chunkLookup.get(to[0])
              var destinationSlot = destinationChunk && destinationChunk.getSlot(to[1])
              if (destinationSlot && destinationSlot.input){
                output.connect(destinationSlot.input)
                routed = true
              }
            }
          }
        })

        if (routed){
          externalConnections.push(output)
        }
      }
    })
  }
}
