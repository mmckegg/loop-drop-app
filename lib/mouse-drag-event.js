var Delegator = require('dom-delegator')

var delegator = Delegator()
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

function handle(ev){

  if (ev.type === 'mousedown') {

    ev.preventDefault()
    delegator.addGlobalEventListener('mousemove', this)
    delegator.addGlobalEventListener('mouseup', this)

    this.target = ev.target
    this.startX = ev.clientX
    this.startY = ev.clientY

  } else if (ev.type === 'mouseup') {
    delegator.removeGlobalEventListener('mousemove', this)
    delegator.removeGlobalEventListener('mouseup', this)
  }

  this.fn({
    x: ev.clientX,
    y: ev.clientY,
    offsetX: ev.clientX - this.startX,
    offsetY: ev.clientY - this.startY,
    altKey: ev.altKey,
    ctrlKey: ev.ctrlKey,
    shiftKey: ev.shiftKey,
    type: ev.type,
    target: this.target,
    currentTarget: ev.currentTarget
  })
}