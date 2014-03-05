var Through = require('through')
module.exports = function(instance){
  return Through(function(event){
    if (Array.isArray(event)){
      event = { // schedule event for immediate playback if not already scheduled
        time: instance.context.currentTime,
        data: event
      }
    }

    if (event.data[2]){
      instance.triggerOn(event.data[1], event.time)
    } else {
      instance.triggerOff(event.data[1], event.time)
    }

    // trampoline
    var self = this
    process.nextTick(function(){
      self.queue(event)
    })

  })
}