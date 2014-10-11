module.exports = ValueEventHandler

function ValueEventHandler(fn, attribute) {
  return {
    fn: fn,
    attribute: attribute || 'value',
    handleEvent: handleEvent
  }
}

function handleEvent(ev) {
  var value = ev.currentTarget[this.attribute]
  this.fn(value)
}