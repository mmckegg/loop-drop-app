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
  if (ev.type === 'mousedown') {
    ev.preventDefault()
    document.documentElement.addEventListener('mousemove', this)
    document.documentElement.addEventListener('mouseup', this)
    this.target = ev.target
    this.startX = ev.clientX
    this.startY = ev.clientY
  } else if (ev.type === 'mouseup') {
    document.documentElement.removeEventListener('mousemove', this)
    document.documentElement.removeEventListener('mouseup', this)
  }

  this.fn({
    x: ev.clientX,
    y: ev.clientY,
    offsetX: ev.clientX - this.startX,
    offsetY: ev.clientY - this.startY,
    altKey: ev.altKey,
    metaKey: ev.metaKey,
    ctrlKey: ev.ctrlKey,
    shiftKey: ev.shiftKey,
    type: ev.type,
    target: this.target,
    currentTarget: ev.currentTarget
  })
}
