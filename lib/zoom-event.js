module.exports = ZoomEvent

function ZoomEvent (fn, data) {
  var handler = {
    handleEvent: handle,
    fn: fn,
    data: data
  }
  return handler
}

function handle (ev) {
  if (ev.ctrlKey) {
    ev.preventDefault()
    ev.stopImmediatePropagation()
    this.fn(ev.deltaY, this.data)
  }
}
