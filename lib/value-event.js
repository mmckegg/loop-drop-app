module.exports = ValueEventHandler

function ValueEventHandler(fn, attribute, data) {
  return {
    fn: fn,
    data: data,
    attribute: attribute || 'value',
    handleEvent: handleEvent
  }
}

function handleEvent(ev) {
  var value = ev.currentTarget[this.attribute]
  this.fn(value)
}