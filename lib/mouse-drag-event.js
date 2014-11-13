var delegator = require('mercury').Delegator()

delegator.listenTo('mousemove')

module.exports = function(fn, data, opts){
  var handler = {
    fn: fn,
    data: data || {},
    opts: opts || {},
    handleEvent: handle
  }
  return handler;
}

function mouseUp(ev){
  delegator.removeGlobalEventListener('mousemove', this.handler)
  delegator.removeGlobalEventListener('mouseup', this)
}

function handle(ev){

  if (ev.type === 'mousedown'){
    
    var upHandler = {
      handleEvent: mouseUp,
      handler: this
    }

    delegator.addGlobalEventListener('mousemove', this)
    delegator.addGlobalEventListener('mouseup', upHandler)
  }

  this.fn({
    x: ev.clientX,
    y: ev.clientY,
    type: ev.type,
    currentTarget: ev.currentTarget
  })
}