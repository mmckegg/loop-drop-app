module.exports = ZoomEvent

var delegator = require('dom-delegator')()
delegator.listenTo('mousewheel')

function ZoomEvent (fn, data){
  var handler = {
    handleEvent: handle,
    fn: fn,
    data: data
  }
  return handler
}

function handle(ev){
  if (ev.ctrlKey) {
    var raw = ev._rawEvent
    ev.preventDefault()
    raw.stopImmediatePropagation()
    this.fn(raw.deltaY, this.data)
  }
}