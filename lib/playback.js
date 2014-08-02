var Through = require('through')
module.exports = function(instance){
  return Through(function(data){
    if (Array.isArray(data)){
      data = { // schedule midi note
        id: String(data[1]),
        event: data[2] ? 'start' : 'stop',
        time: instance.context.currentTime,
        args: [data[2]]
      }
    }

    if (data.event === 'start'){
      instance.triggerOn(data.id, data.time)
    } else if (data.event === 'stop') {
      instance.triggerOff(data.id, data.time)
    }

    // trampoline
    var self = this
    process.nextTick(function(){
      self.queue(data)
    })
  })
}