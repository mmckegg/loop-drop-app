module.exports = FileEventHandler

function FileEventHandler(fn, data) {
  return {
    fn: fn,
    data: data,
    handleEvent: handleEvent
  }
}

function handleEvent(ev) {
  var value = ev.currentTarget.files[0]
  this.fn(value)
}