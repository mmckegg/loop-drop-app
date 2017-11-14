var h = require('lib/h')
var MPE = require('lib/mouse-position-event')
var resolve = require('mutant/resolve')

module.exports = Orderable

function Orderable (node, children, opts) {
  return h('Orderable', {
    draggable: true,
    'ev-dragstart': MPE(dragStart, node, opts),
    'ev-dragend': MPE(dragEnd, node, opts),
    'ev-dragover': MPE(dragOver, node, opts)
  }, children)
}

function dragOver (ev) {
  var currentTarget = window.currentDrag
  var shouldAccept = this.opts && typeof this.opts.accept === 'function'
    ? this.opts.accept(currentTarget)
    : currentTarget && currentTarget.node

  if (shouldAccept && !ev.altKey && !ev.shiftKey) {
    var fromCollection = currentTarget.node.context.collection
    var toCollection = ev.data.context.collection

    if (fromCollection === toCollection && ev.data !== currentTarget.data) {
      var index = toCollection.indexOf(ev.data)
      if (~index) {
        if (ev.offsetY <= currentTarget.offsetHeight) {
          toCollection.move(currentTarget.data, index)
        } else if (ev.offsetY > ev.offsetHeight - currentTarget.offsetHeight) {
          toCollection.move(currentTarget.data, index + 1)
        }
      }
    }
  }
}

function dragStart (ev) {
  var data = ev.data()
  if (data.node) {
    var setup = ev.data.context.setup
    var type = data.node.split('/')[0]
    if (type === 'externalChunk') {
      type = 'chunk'
    }
    ev.dataTransfer.setData('loop-drop/' + type, JSON.stringify(data))
    ev.dataTransfer.setData('cwd', resolve(setup.context.cwd))
  }

  ev.ordering = true
  ev.node = ev.data
  window.currentDrag = ev
}

function dragEnd (ev) {
  if (ev.dataTransfer.dropEffect === 'move') {
    ev.data.context.collection.remove(ev.data)
  }
  window.currentDrag = null
}
