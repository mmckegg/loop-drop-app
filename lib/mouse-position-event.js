module.exports = function (fn, data, opts) {
  var handler = {
    fn: fn,
    data: data || {},
    opts: opts || {},
    handleEvent: handle
  }
  return handler
}

function handle (ev) {
  ev.stopPropagation()
  var box = ev.currentTarget.getBoundingClientRect()
  this.fn({
    x: ev.clientX,
    y: ev.clientY,
    offsetWidth: ev.currentTarget.offsetWidth,
    offsetHeight: ev.currentTarget.offsetHeight,
    offsetX: ev.clientX - box.left,
    offsetY: ev.clientY - box.top,
    dataTransfer: ev.dataTransfer,
    currentTarget: ev.currentTarget,

    ctrlKey: ev.ctrlKey,
    shiftKey: ev.shiftKey,
    altKey: ev.altKey,
    metaKey: ev.metaKey,

    event: ev,
    target: ev.target,
    data: this.data
  })
}
