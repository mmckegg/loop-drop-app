var h = require('lib/h')
var MPE = require('lib/mouse-position-event')

module.exports = Orderable

function Orderable (node, children) {
  return h('Orderable', {
    draggable: true,
    'ev-dragstart': MPE(dragStart, node),
    'ev-dragend': MPE(dragEnd, node),
    'ev-dragover': MPE(dragOver, node)
  }, children)
}

function dragOver (ev) {
  var currentTarget = window.currentDrag
  if (currentTarget && currentTarget.data && !ev.altKey && !ev.shiftKey) {
    var fromCollection = currentTarget.data.context.collection
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
  var node = (ev.data.resolved || ev.data)()
  ev.dataTransfer.setData('loop-drop/' + node.node.split('/')[0], JSON.stringify(node))
  ev.dataTransfer.setData('cwd', ev.data.context.cwd)
  window.currentDrag = ev
}

function dragEnd (ev) {
  if (ev.dataTransfer.dropEffect === 'move') {
    ev.data.context.collection.remove(ev.data)
  }
  window.currentDrag = null
}
